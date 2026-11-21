import type { Request, Response } from 'express'
import { currentUserId } from '../middleware/auth'
import { Subject } from '../models/Subject'
import { Task } from '../models/Task'
import { ApiError } from '../utils/ApiError'
import { requireObjectId } from '../utils/objectId'
import { taskQuerySchema, type TaskInput } from '../validators/task'

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Finds a task only if it belongs to the logged-in user
async function findOwnedTask(req: Request) {
  const id = requireObjectId(req.params.id, 'Task')
  const task = await Task.findOne({ _id: id, userId: currentUserId(req) })
  if (!task) throw new ApiError(404, 'Task not found')
  return task
}

// A task may only use one of the user's own subjects
async function assertSubjectOwned(subjectId: string, userId: string) {
  if (!(await Subject.exists({ _id: subjectId, userId }))) throw new ApiError(400, 'Subject not found')
}

export async function listTasks(req: Request, res: Response) {
  const userId = currentUserId(req)
  const { q, status, priority, subjectId, sort } = taskQuerySchema.parse(req.query)

  const filter: Record<string, any> = { userId }
  if (status) filter.status = status
  if (priority) filter.priority = priority
  if (subjectId) filter.subjectId = subjectId
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' }

  const tasks = await Task.find(filter).sort(
    sort === 'createdAt' ? { createdAt: -1 } : { dueDate: 1, createdAt: -1 },
  )
  res.json({ success: true, data: { tasks } })
}

export async function getTask(req: Request, res: Response) {
  const task = await findOwnedTask(req)
  res.json({ success: true, data: { task } })
}

export async function createTask(req: Request, res: Response) {
  const userId = currentUserId(req)
  const input = req.body as TaskInput
  await assertSubjectOwned(input.subjectId, userId)

  const task = await Task.create({
    ...input,
    userId,
    completedAt: input.status === 'Completed' ? new Date() : null,
  })
  res.status(201).json({ success: true, data: { task } })
}

export async function updateTask(req: Request, res: Response) {
  const userId = currentUserId(req)
  const task = await findOwnedTask(req)
  const input = req.body as TaskInput
  await assertSubjectOwned(input.subjectId, userId)

  const wasCompleted = task.status === 'Completed'
  task.set(input)
  if (input.status !== 'Completed') task.set('completedAt', null)
  else if (!wasCompleted) task.set('completedAt', new Date())
  await task.save()

  res.json({ success: true, data: { task } })
}

export async function deleteTask(req: Request, res: Response) {
  const task = await findOwnedTask(req)
  await task.deleteOne()
  res.json({ success: true, message: 'Task deleted' })
}
