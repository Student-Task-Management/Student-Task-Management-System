import { Router } from 'express'
import mongoose from 'mongoose'
import adminRoutes from './admin.routes'
import authRoutes from './auth.routes'
import dashboardRoutes from './dashboard.routes'
import subjectRoutes from './subject.routes'
import taskRoutes from './task.routes'
import userRoutes from './user.routes'

const router = Router()

// Used by Docker and monitoring tools: 200 only when the database is reachable too
router.get('/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    data: {
      status: dbConnected ? 'ok' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  })
})

router.use('/admin', adminRoutes)
router.use('/auth', authRoutes)
router.use('/tasks', taskRoutes)
router.use('/subjects', subjectRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/users', userRoutes)

export default router
