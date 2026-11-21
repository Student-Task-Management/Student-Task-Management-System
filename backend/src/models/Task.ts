import { Schema, model } from 'mongoose'
import { jsonOptions } from '../utils/modelJson'

const taskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    dueDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
    completedAt: { type: Date, default: null }, // set when the task is completed, used by analytics
  },
  { timestamps: true, toJSON: jsonOptions }, // adds createdAt and updatedAt
)

// Indexes make the common queries fast
taskSchema.index({ userId: 1, dueDate: 1 })
taskSchema.index({ userId: 1, status: 1 })
taskSchema.index({ userId: 1, subjectId: 1 })

export const Task = model('Task', taskSchema)
