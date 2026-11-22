import { Schema, model } from 'mongoose'
import { jsonOptions } from '../utils/modelJson'

// The subject catalog: the subjects every new student receives at sign-up
const templateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
    color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    description: { type: String, default: '', trim: true, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonOptions },
)

// No two catalog subjects with the same name (case-insensitive)
templateSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })

export const SubjectTemplate = model('SubjectTemplate', templateSchema)
