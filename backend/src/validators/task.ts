import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title must be 100 characters or less'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').default(''),
  subjectId: z.string().min(1, 'Please choose a subject'),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Due date is not a valid date'),
})
