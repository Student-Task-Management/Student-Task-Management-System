import { Router } from 'express'
import { changePassword, getProfile, removeAvatar, updateAvatar, updateProfile } from '../controllers/user.controller'
import { requireAuth } from '../middleware/auth'
import { uploadAvatar } from '../middleware/upload'
import { validate } from '../middleware/validate'
import { changePasswordSchema, updateProfileSchema } from '../validators/user'

const router = Router()
router.use(requireAuth)

router.get('/profile', getProfile)
router.put('/profile', validate(updateProfileSchema), updateProfile)
router.put('/password', validate(changePasswordSchema), changePassword)
router.post('/avatar', uploadAvatar, updateAvatar)
router.delete('/avatar', removeAvatar)

export default router