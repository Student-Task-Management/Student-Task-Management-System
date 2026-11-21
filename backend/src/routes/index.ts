import { Router } from 'express'
import authRoutes from './auth.routes'
import dashboardRoutes from './dashboard.routes'
import subjectRoutes from './subject.routes'
import taskRoutes from './task.routes'
import userRoutes from './user.routes'

const router = Router()

// Used by Docker and monitoring tools to check that the API is alive
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() },
  })
})

router.use('/auth', authRoutes)
router.use('/tasks', taskRoutes)
router.use('/subjects', subjectRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/users', userRoutes)

export default router
