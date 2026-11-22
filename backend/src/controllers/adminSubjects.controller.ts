import type { Request, Response } from 'express'
import { Subject } from '../models/Subject'
import { SubjectTemplate } from '../models/SubjectTemplate'
import { ApiError } from '../utils/ApiError'
import { requireObjectId } from '../utils/objectId'

const sameName = { locale: 'en', strength: 2 } as const

// The catalog, with how many student accounts currently have a subject with that name
export async function listCatalog(_req: Request, res: Response) {
  const [templates, usage] = await Promise.all([
    SubjectTemplate.find().collation(sameName).sort({ name: 1 }),
    Subject.aggregate<{ _id: string; count: number }>([
      { $group: { _id: { $toLower: '$name' }, count: { $sum: 1 } } },
    ]),
  ])
  const used = new Map(usage.map((u) => [u._id, u.count]))

  res.json({
    success: true,
    data: {
      subjects: templates.map((t) => ({ ...t.toJSON(), studentCount: used.get(t.name.toLowerCase()) ?? 0 })),
    },
  })
}

export async function createSubject(req: Request, res: Response) {
  if (await SubjectTemplate.exists({ name: req.body.name }).collation(sameName)) {
    throw new ApiError(409, 'A subject with this name already exists')
  }
  const subject = await SubjectTemplate.create(req.body)
  res.status(201).json({ success: true, data: { subject } })
}

export async function updateSubject(req: Request, res: Response) {
  const subject = await SubjectTemplate.findById(requireObjectId(req.params.id, 'Subject'))
  if (!subject) throw new ApiError(404, 'Subject not found')

  if (await SubjectTemplate.exists({ name: req.body.name, _id: { $ne: subject._id } }).collation(sameName)) {
    throw new ApiError(409, 'A subject with this name already exists')
  }
  subject.set(req.body)
  await subject.save()
  res.json({ success: true, data: { subject } })
}

// Removes the subject from the catalog only. Students who already have it keep their copy.
export async function deleteSubject(req: Request, res: Response) {
  const subject = await SubjectTemplate.findByIdAndDelete(requireObjectId(req.params.id, 'Subject'))
  if (!subject) throw new ApiError(404, 'Subject not found')
  res.json({ success: true, message: 'Subject removed from the catalog' })
}
