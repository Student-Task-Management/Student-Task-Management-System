import type { Types } from 'mongoose'
import { Subject } from '../models/Subject'
import { SubjectTemplate } from '../models/SubjectTemplate'

const DEFAULTS = [
  { name: 'Programming', color: '#6366f1', description: 'Web development and coding labs' },
  { name: 'Database', color: '#0ea5e9', description: 'SQL, ER diagrams and MongoDB' },
  { name: 'English', color: '#f59e0b', description: 'Essays, reports and presentations' },
  { name: 'Networking', color: '#10b981', description: 'Protocols, subnetting and topology' },
  { name: 'Mathematics', color: '#ec4899', description: 'Calculus and linear algebra' },
]

// Runs at server start. The default subjects are added only while the catalog is empty.
export async function ensureCatalog() {
  if ((await SubjectTemplate.estimatedDocumentCount()) === 0) {
    await SubjectTemplate.insertMany(DEFAULTS)
    console.log('Subject catalog created with the default subjects')
  }
}

// Gives a new student a copy of every catalog subject
export async function seedUserSubjects(userId: Types.ObjectId | string) {
  const templates = await SubjectTemplate.find().sort({ _id: 1 })
  if (templates.length === 0) return
  await Subject.insertMany(
    templates.map((t) => ({ userId, name: t.name, color: t.color, description: t.description })),
  )
}
