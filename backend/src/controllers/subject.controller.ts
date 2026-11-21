import type { Request, Response } from 'express'
import { Types } from 'mongoose'
import { currentUserId } from '../middleware/auth'
import { Subject } from '../models/Subject'
import { Task } from '../models/Task'
import { ApiError } from '../utils/ApiError'
import { requireObjectId } from '../utils/objectId'

async function findOwnedSubject(req: Request) {
  const id = requireObjectId(req.params.id, 'Subject')
  const subject = await Subject.findOne({ _id: id, userId: currentUserId(req) })
  if (!subject) throw new ApiError(404, 'Subject not found')
  return subject
}

// Subjects come with live task counts, so the Subjects page needs only one request
export async function listSubjects(req: Request, res: Response) {
  const userId = currentUserId(req)

  const [subjects, counts] = await Promise.all([
    Subject.find({ userId }).sort({ createdAt: 1, _id: 1 }),
    Task.aggregate<{ _id: Types.ObjectId; total: number; completed: number }>([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$subjectId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        },
      },
    ]),
  ])

  const byId = new Map(counts.map((c) => [String(c._id), c]))
  res.json({
    success: true,
    data: {
      subjects: subjects.map((s) => ({
        ...s.toJSON(),
        taskCount: byId.get(s.id)?.total ?? 0,
        completedCount: byId.get(s.id)?.completed ?? 0,
      })),
    },
  })
}

export async function createSubject(req: Request, res: Response) {
  const subject = await Subject.create({ ...req.body, userId: currentUserId(req) })
  res.status(201).json({ success: true, data: { subject } })
}

export async function updateSubject(req: Request, res: Response) {
  const subject = await findOwnedSubject(req)
  subject.set(req.body)
  await subject.save()
  res.json({ success: true, data: { subject } })
}

// Deleting a subject also deletes its tasks
export async function deleteSubject(req: Request, res: Response) {
  const userId = currentUserId(req)
  const subject = await findOwnedSubject(req)

  const { deletedCount } = await Task.deleteMany({ userId, subjectId: subject._id })
  await subject.deleteOne()

  res.json({ success: true, message: 'Subject deleted', data: { deletedTasks: deletedCount } })
}
