import 'dotenv/config'
import { z } from 'zod'

// All settings come from environment variables (the .env file locally).
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  parsed.error.issues.forEach((i) => console.error(`- ${i.path.join('.')}: ${i.message}`))
  process.exit(1)
}

export const env = parsed.data
