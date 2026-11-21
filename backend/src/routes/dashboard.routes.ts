import { Router } from 'express'
import { activity, stats } from '../controllers/dashboard.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/stats', stats)
router.get('/activity', activity)

export default router
