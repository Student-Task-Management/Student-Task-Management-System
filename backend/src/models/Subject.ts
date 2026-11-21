import { Schema, model } from 'mongoose'
import { jsonOptions } from '../utils/modelJson'

const subjectSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
    color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    description: { type: String, default: '', trim: true, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonOptions },
)

// One user cannot have two subjects with the same name (case-insensitive)
subjectSchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })

export const Subject = model('Subject', subjectSchema)
