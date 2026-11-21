import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, me, register } from '../controllers/auth.controller'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { loginSchema, registerSchema } from '../validators/auth'

const router = Router()

// Slows down password guessing: at most 30 attempts per 15 minutes per IP address
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
})

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.get('/me', requireAuth, me)

export default router
