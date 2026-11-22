import type { Request, Response } from 'express'
import { Subject } from '../models/Subject'
import { Task } from '../models/Task'
import { User } from '../models/User'
import { taskTotals } from '../services/adminMetrics'
import { ApiError } from '../utils/ApiError'
import { todayFrom } from '../utils/dates'
import { requireObjectId } from '../utils/objectId'
import { cleanQuery } from '../utils/query'
import { adminTaskQuerySchema } from '../validators/admin'

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Every student's tasks, with filters and pages
export async function listTasks(req: Request, res: Response) {
  const query = adminTaskQuerySchema.parse(cleanQuery(req))
  const today = todayFrom(query.today)

  const and: Record<string, any>[] = []
  if (query.userId) and.push({ userId: query.userId })
  if (query.priority) and.push({ priority: query.priority })
  if (query.status) and.push({ status: query.status })
  if (query.q) and.push({ title: { $regex: escapeRegex(query.q), $options: 'i' } })
  if (query.overdue === 'true') and.push({ status: { $ne: 'Completed' } }, { dueDate: { $lt: today } })
  if (query.subject) {
    // Subjects belong to each student, so they are matched by name
    const ids = await Subject.find({ name: { $regex: `^${escapeRegex(query.subject)}$`, $options: 'i' } }).distinct('_id')
    and.push({ subjectId: { $in: ids } })
  }
  const filter = and.length ? { $and: and } : {}

  const sort: Record<string, 1 | -1> =
    query.sort === 'createdAt' ? { createdAt: -1 } : { dueDate: 1, createdAt: -1 }

  const [tasks, total, summary, subjectNames] = await Promise.all([
    Task.find(filter).sort(sort).skip((query.page - 1) * query.limit).limit(query.limit),
    Task.countDocuments(filter),
    taskTotals(today),
    Subject.distinct('name'),
  ])

  const [users, subjects] = await Promise.all([
    User.find({ _id: { $in: [...new Set(tasks.map((t) => String(t.userId)))] } }).select('name email'),
    Subject.find({ _id: { $in: [...new Set(tasks.map((t) => String(t.subjectId)))] } }).select('name color'),
  ])
  const userById = new Map(users.map((u) => [u.id, { id: u.id, name: u.name, email: u.email }]))
  const subjectById = new Map(subjects.map((s) => [s.id, { name: s.name, color: s.color }]))

  // One entry per name, ignoring upper/lower case
  const names = [...new Map(subjectNames.map((n: string) => [n.toLowerCase(), n])).values()].sort((a, b) => a.localeCompare(b))

  res.json({
    success: true,
    data: {
      tasks: tasks.map((t) => ({
        ...t.toJSON(),
        user: userById.get(String(t.userId)) ?? null,
        subject: subjectById.get(String(t.subjectId)) ?? null,
        overdue: t.status !== 'Completed' && t.dueDate < today,
      })),
      pagination: { page: query.page, limit: query.limit, total, pages: Math.max(1, Math.ceil(total / query.limit)) },
      summary,
      subjectNames: names,
    },
  })
}

export async function deleteTask(req: Request, res: Response) {
  const task = await Task.findByIdAndDelete(requireObjectId(req.params.id, 'Task'))
  if (!task) throw new ApiError(404, 'Task not found')
  res.json({ success: true, message: 'Task deleted' })
}
