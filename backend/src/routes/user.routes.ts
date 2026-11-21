import { Router } from 'express'
import { changePassword, getProfile, updateProfile } from '../controllers/user.controller'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { changePasswordSchema, updateProfileSchema } from '../validators/user'

const router = Router()
router.use(requireAuth)

router.get('/profile', getProfile)
router.put('/profile', validate(updateProfileSchema), updateProfile)
router.put('/password', validate(changePasswordSchema), changePassword)

export default router
