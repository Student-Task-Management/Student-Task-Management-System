import type { Request, Response } from 'express'
import { hash } from 'bcryptjs'
import type { Types } from 'mongoose'
import { currentUserId } from '../middleware/auth'
import { Subject } from '../models/Subject'
import { Task } from '../models/Task'
import { User } from '../models/User'
import { taskTotals } from '../services/adminMetrics'
import { seedUserSubjects } from '../services/subjectCatalog'
import { ApiError } from '../utils/ApiError'
import { todayFrom } from '../utils/dates'
import { requireObjectId } from '../utils/objectId'
import { cleanQuery } from '../utils/query'
import { adminUserQuerySchema } from '../validators/admin'

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

type Counts = { _id: Types.ObjectId; total: number; completed: number }

// Task and completed-task counts, grouped by student or by subject
async function taskCountsBy(field: 'userId' | 'subjectId', match: Record<string, unknown> = {}) {
  const rows = await Task.aggregate<Counts>([
    { $match: match },
    {
      $group: {
        _id: `$${field}`,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
      },
    },
  ])
  return new Map(rows.map((r) => [String(r._id), r]))
}

type Action = 'update' | 'status' | 'role' | 'delete'

// Which accounts may the logged-in admin change?
//  - Yourself: edit name, email and password only (never role, status or deletion)
//  - Students: everything
//  - Other admins: only the role (demote to Student first, then manage)
async function findManaged(req: Request, action: Action) {
  const user = await User.findById(requireObjectId(req.params.id, 'User'))
  if (!user) throw new ApiError(404, 'User not found')

  const isSelf = user.id === currentUserId(req)
  if (isSelf && action !== 'update') throw new ApiError(400, 'You cannot do this to your own account')
  if (!isSelf && user.role === 'admin' && action !== 'role') {
    throw new ApiError(403, 'This is an administrator account. Change its role to Student first.')
  }
  return user
}

export async function listUsers(req: Request, res: Response) {
  const { q, role, status } = adminUserQuerySchema.parse(cleanQuery(req))

  const filter: Record<string, any> = {}
  if (role === 'admin') filter.role = 'admin'
  else if (role === 'user') filter.role = { $ne: 'admin' }
  if (status === 'disabled') filter.disabled = true
  if (status === 'active') filter.disabled = { $ne: true }
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' }
    filter.$or = [{ name: rx }, { email: rx }]
  }

  const [users, counts] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).limit(500),
    taskCountsBy('userId'),
  ])

  res.json({
    success: true,
    data: {
      users: users.map((u) => ({
        ...u.toJSON(),
        taskCount: counts.get(u.id)?.total ?? 0,
        completedCount: counts.get(u.id)?.completed ?? 0,
      })),
    },
  })
}

// One account with its task totals, subjects and latest activity
export async function getUser(req: Request, res: Response) {
  const user = await User.findById(requireObjectId(req.params.id, 'User'))
  if (!user) throw new ApiError(404, 'User not found')
  const today = todayFrom(req.query.today)

  const [totals, subjects, counts, recent] = await Promise.all([
    taskTotals(today, user._id),
    Subject.find({ userId: user._id }).sort({ createdAt: 1, _id: 1 }),
    taskCountsBy('subjectId', { userId: user._id }),
    Task.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(10),
  ])

  const bySubject = new Map(subjects.map((s) => [s.id, { name: s.name, color: s.color }]))
  res.json({
    success: true,
    data: {
      user,
      totals,
      subjects: subjects.map((s) => ({
        ...s.toJSON(),
        taskCount: counts.get(s.id)?.total ?? 0,
        completedCount: counts.get(s.id)?.completed ?? 0,
      })),
      recentTasks: recent.map((t) => ({
        ...t.toJSON(),
        subject: bySubject.get(String(t.subjectId)) ?? null,
        overdue: t.status !== 'Completed' && t.dueDate < today,
      })),
    },
  })
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role } = req.body

  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists')

  const user = await User.create({ name, email, password: await hash(password, 12), role })
  if (role !== 'admin') await seedUserSubjects(user._id)

  res.status(201).json({
    success: true,
    data: { user: { ...user.toJSON(), taskCount: 0, completedCount: 0 } },
  })
}

export async function updateUser(req: Request, res: Response) {
  const user = await findManaged(req, 'update')
  const { name, email, password } = req.body

  if (email !== user.email && (await User.exists({ email, _id: { $ne: user._id } }))) {
    throw new ApiError(409, 'An account with this email already exists')
  }

  user.name = name
  user.email = email
  if (password) user.password = await hash(password, 12)
  await user.save()

  res.json({ success: true, data: { user } })
}

export async function setUserStatus(req: Request, res: Response) {
  const user = await findManaged(req, 'status')
  user.disabled = req.body.disabled
  await user.save()
  res.json({ success: true, data: { user } })
}

// Takes effect immediately, because requireAuth reads the role from the database on every request
export async function setUserRole(req: Request, res: Response) {
  const user = await findManaged(req, 'role')
  user.role = req.body.role
  await user.save()
  res.json({ success: true, data: { user } })
}

// Deleting a user also deletes all of their tasks and subjects
export async function deleteUser(req: Request, res: Response) {
  const user = await findManaged(req, 'delete')

  const tasks = await Task.deleteMany({ userId: user._id })
  await Subject.deleteMany({ userId: user._id })
  await user.deleteOne()

  res.json({ success: true, message: 'User deleted', data: { deletedTasks: tasks.deletedCount } })
}
