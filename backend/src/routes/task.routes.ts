import { Router } from 'express'
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/task.controller'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { taskSchema } from '../validators/task'

const router = Router()
router.use(requireAuth) // every task route needs a logged-in user

router.get('/', listTasks)
router.post('/', validate(taskSchema), createTask)
router.get('/:id', getTask)
router.put('/:id', validate(taskSchema), updateTask)
router.delete('/:id', deleteTask)

export default router
