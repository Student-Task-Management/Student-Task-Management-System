import { z } from 'zod'

export const userStatusSchema = z.object({
  disabled: z.boolean(),
})
