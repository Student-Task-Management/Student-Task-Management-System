import { z } from 'zod'
import { isObjectId } from '../utils/objectId'

export const taskSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title must be 100 characters or less'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').default(''),
  subjectId: z.string().refine((v) => isObjectId(v), 'Please choose a valid subject'),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Due date is not a valid date'),
})

export type TaskInput = z.infer<typeof taskSchema>

// Optional filters for GET /api/tasks
export const taskQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  subjectId: z.string().refine((v) => isObjectId(v), 'Invalid subject id').optional(),
  sort: z.enum(['dueDate', 'createdAt']).default('dueDate'),
})
