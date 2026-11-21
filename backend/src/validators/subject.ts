import { z } from 'zod'

export const subjectSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(30, 'Name must be 30 characters or less'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #6366f1'),
  description: z.string().trim().max(200, 'Description must be 200 characters or less').default(''),
})
