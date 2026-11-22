import type { Request, Response } from 'express'
import { Types } from 'mongoose'
import { currentUserId } from '../middleware/auth'
import { Subject } from '../models/Subject'
import { Task } from '../models/Task'
import { User } from '../models/User'
import { ApiError } from '../utils/ApiError'
import { requireObjectId } from '../utils/objectId'

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Admin screens deal with students only (accounts that are not administrators)
const studentFilter: Record<string, any> = { role: { $ne: 'admin' } }

// Finds a student account the admin is allowed to change
async function findStudent(req: Request) {
  const id = requireObjectId(req.params.id, 'User')
  const user = await User.findById(id)
  if (!user) throw new ApiError(404, 'User not found')
  if (user.id === currentUserId(req)) throw new ApiError(400, 'You cannot change your own account here')
  if (user.role === 'admin') throw new ApiError(403, 'Administrator accounts cannot be changed here')
  return user
}

export async function stats(_req: Request, res: Response) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalUsers, activeUsers, newThisWeek, totalTasks, completedTasks, recentUsers] = await Promise.all([
    User.countDocuments(studentFilter),
    User.countDocuments({ ...studentFilter, disabled: { $ne: true } }),
    User.countDocuments({ ...studentFilter, createdAt: { $gte: weekAgo } }),
    Task.countDocuments(),
    Task.countDocuments({ status: 'Completed' }),
    User.find(studentFilter).sort({ createdAt: -1 }).limit(5),
  ])

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      newThisWeek,
      totalTasks,
      completedTasks,
      completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
      recentUsers,
    },
  })
}

export async function listUsers(req: Request, res: Response) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : ''

  const filter: Record<string, any> = { ...studentFilter }
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' }
    filter.$or = [{ name: rx }, { email: rx }]
  }

  const [users, counts] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }),
    Task.aggregate<{ _id: Types.ObjectId; total: number; completed: number }>([
      {
        $group: {
          _id: '$userId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        },
      },
    ]),
  ])

  const byUser = new Map(counts.map((c) => [String(c._id), c]))
  res.json({
    success: true,
    data: {
      users: users.map((u) => ({
        ...u.toJSON(),
        taskCount: byUser.get(u.id)?.total ?? 0,
        completedCount: byUser.get(u.id)?.completed ?? 0,
      })),
    },
  })
}

export async function setUserStatus(req: Request, res: Response) {
  const user = await findStudent(req)
  user.disabled = req.body.disabled
  await user.save()
  res.json({ success: true, data: { user } })
}

// Deleting a user also deletes all of their tasks and subjects
export async function deleteUser(req: Request, res: Response) {
  const user = await findStudent(req)

  const tasks = await Task.deleteMany({ userId: user._id })
  await Subject.deleteMany({ userId: user._id })
  await user.deleteOne()

  res.json({ success: true, message: 'User deleted', data: { deletedTasks: tasks.deletedCount } })
}
