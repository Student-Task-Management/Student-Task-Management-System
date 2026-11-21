import { Router } from 'express'
import { validate } from '../middleware/validate'
import { notImplemented } from '../utils/notImplemented'
import { updateProfileSchema } from '../validators/user'

const router = Router()

router.get('/profile', notImplemented)
router.put('/profile', validate(updateProfileSchema), notImplemented)

export default router
