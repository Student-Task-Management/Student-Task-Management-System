import { z } from 'zod'
import { isObjectId } from '../utils/objectId'
import { passwordRule } from './auth'

const nameRule = z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be 60 characters or less')
const emailRule = z.string().trim().toLowerCase().email('Please enter a valid email address')
const roleRule = z.enum(['user', 'admin'])
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const userStatusSchema = z.object({ disabled: z.boolean() })
export const userRoleSchema = z.object({ role: roleRule })

// An admin can create students and other administrators. The default is a student.
export const createUserSchema = z.object({
  name: nameRule,
  email: emailRule,
  password: passwordRule,
  role: roleRule.default('user'),
})

// The password is optional when editing: empty or missing means "keep the current one"
export const updateUserSchema = z.object({
  name: nameRule,
  email: emailRule,
  password: z.union([z.literal(''), passwordRule]).optional(),
})

// Filters for GET /api/admin/users
export const adminUserQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: roleRule.optional(),
  status: z.enum(['active', 'disabled']).optional(),
})

// Filters for GET /api/admin/tasks
export const adminTaskQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  userId: z.string().refine((v) => isObjectId(v), 'Invalid student id').optional(),
  subject: z.string().trim().max(30).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
  overdue: z.enum(['true', 'false']).optional(),
  today: dateKey.optional(),
  sort: z.enum(['dueDate', 'createdAt']).default('dueDate'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
