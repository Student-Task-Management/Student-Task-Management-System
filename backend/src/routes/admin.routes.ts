import { Router } from 'express'
import { deleteUser, listUsers, setUserStatus, stats } from '../controllers/admin.controller'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { userStatusSchema } from '../validators/admin'

const router = Router()
router.use(requireAuth, requireAdmin) // every admin route needs a logged-in administrator

router.get('/stats', stats)
router.get('/users', listUsers)
router.patch('/users/:id/status', validate(userStatusSchema), setUserStatus)
router.delete('/users/:id', deleteUser)

export default router
