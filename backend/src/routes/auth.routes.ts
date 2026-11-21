import { Router } from 'express'
import { validate } from '../middleware/validate'
import { notImplemented } from '../utils/notImplemented'
import { loginSchema, registerSchema } from '../validators/auth'

const router = Router()

router.post('/register', validate(registerSchema), notImplemented)
router.post('/login', validate(loginSchema), notImplemented)
router.get('/me', notImplemented)

export default router
