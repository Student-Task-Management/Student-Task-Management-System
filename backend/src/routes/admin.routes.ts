import { Router } from 'express'
import {
  createUser, deleteUser, getUser, listUsers, setUserRole, setUserStatus, updateUser,
} from '../controllers/admin.controller'
import * as adminSubjects from '../controllers/adminSubjects.controller'
import { stats } from '../controllers/adminStats.controller'
import * as adminTasks from '../controllers/adminTasks.controller'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createUserSchema, updateUserSchema, userRoleSchema, userStatusSchema } from '../validators/admin'
import { subjectSchema } from '../validators/subject'

const router = Router()

// Every admin route needs a logged-in administrator. A student gets 403 here,
// even if they call the API directly without using the website.
router.use(requireAuth, requireAdmin)

router.get('/stats', stats)

router.get('/users', listUsers)
router.post('/users', validate(createUserSchema), createUser)
router.get('/users/:id', getUser)
router.put('/users/:id', validate(updateUserSchema), updateUser)
router.patch('/users/:id/status', validate(userStatusSchema), setUserStatus)
router.patch('/users/:id/role', validate(userRoleSchema), setUserRole)
router.delete('/users/:id', deleteUser)

router.get('/tasks', adminTasks.listTasks)
router.delete('/tasks/:id', adminTasks.deleteTask)

router.get('/subjects', adminSubjects.listCatalog)
router.post('/subjects', validate(subjectSchema), adminSubjects.createSubject)
router.put('/subjects/:id', validate(subjectSchema), adminSubjects.updateSubject)
router.delete('/subjects/:id', adminSubjects.deleteSubject)

export default router
