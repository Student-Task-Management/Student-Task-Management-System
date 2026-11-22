import type { Types } from 'mongoose'
import { Task } from '../models/Task'

// Task counts for the whole platform, or for one student when userId is given
export async function taskTotals(today: string, userId?: Types.ObjectId | string) {
  const own = userId ? { userId } : {}
  const [total, pending, inProgress, completed, overdue] = await Promise.all([
    Task.countDocuments({ ...own }),
    Task.countDocuments({ ...own, status: 'Pending' }),
    Task.countDocuments({ ...own, status: 'In Progress' }),
    Task.countDocuments({ ...own, status: 'Completed' }),
    Task.countDocuments({ ...own, status: { $ne: 'Completed' }, dueDate: { $lt: today } }),
  ])
  return { total, pending, inProgress, completed, overdue }
}
