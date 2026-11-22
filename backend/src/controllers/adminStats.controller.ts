import type { Request, Response } from 'express'
import { Subject } from '../models/Subject'
import { SubjectTemplate } from '../models/SubjectTemplate'
import { Task } from '../models/Task'
import { User } from '../models/User'
import { taskTotals } from '../services/adminMetrics'
import { shiftDay, todayFrom } from '../utils/dates'

type DayRow = { _id: string; count: number }

// Counts documents per calendar day (UTC) for the given date field
const byDay = (field: string) => ({
  $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } }, count: { $sum: 1 } },
})

export async function stats(req: Request, res: Response) {
  const today = todayFrom(req.query.today)
  const days = Array.from({ length: 14 }, (_, i) => shiftDay(today, i - 13))
  const since = new Date(`${days[0]}T00:00:00Z`)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    studentCount, activeCount, adminCount, newThisWeek, totals, subjectCount, catalogCount,
    recentUsers, signupRows, createdRows, completedRows, priorityRows, subjectRows,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    User.countDocuments({ role: { $ne: 'admin' }, disabled: { $ne: true } }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: weekAgo } }),
    taskTotals(today),
    Subject.countDocuments(),
    SubjectTemplate.countDocuments(),
    User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(5),
    User.aggregate<DayRow>([{ $match: { role: { $ne: 'admin' }, createdAt: { $gte: since } } }, byDay('createdAt')]),
    Task.aggregate<DayRow>([{ $match: { createdAt: { $gte: since } } }, byDay('createdAt')]),
    Task.aggregate<DayRow>([{ $match: { completedAt: { $gte: since } } }, byDay('completedAt')]),
    Task.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    // Tasks per subject name, added up across all students
    Task.aggregate<{ name: string; color: string; count: number }>([
      { $group: { _id: '$subjectId', count: { $sum: 1 } } },
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 's' } },
      { $unwind: '$s' },
      {
        $group: {
          _id: { $toLower: '$s.name' },
          name: { $first: '$s.name' },
          color: { $first: '$s.color' },
          count: { $sum: '$count' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, name: 1, color: 1, count: 1 } },
    ]),
  ])

  const pick = (rows: DayRow[], day: string) => rows.find((r) => r._id === day)?.count ?? 0
  const activity = days.map((date) => ({
    date,
    label: new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    signups: pick(signupRows, date),
    tasksCreated: pick(createdRows, date),
    tasksCompleted: pick(completedRows, date),
  }))

  const priorities = { High: 0, Medium: 0, Low: 0 } as Record<string, number>
  priorityRows.forEach((r) => { priorities[r._id] = r.count })

  const completionRate = totals.total === 0 ? 0 : Math.round((totals.completed / totals.total) * 100)

  res.json({
    success: true,
    data: {
      students: {
        total: studentCount,
        active: activeCount,
        disabled: studentCount - activeCount,
        admins: adminCount,
        newThisWeek,
      },
      tasks: { ...totals, completionRate },
      subjects: { total: subjectCount, catalog: catalogCount },
      activity,
      priorities,
      topSubjects: subjectRows,
      recentUsers,
      // Older field names, kept so the current admin pages keep working
      totalUsers: studentCount,
      activeUsers: activeCount,
      newThisWeek,
      totalTasks: totals.total,
      completedTasks: totals.completed,
      completionRate,
    },
  })
}
