import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be 60 characters or less'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
})
