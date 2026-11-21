import { Router } from 'express'
import { validate } from '../middleware/validate'
import { notImplemented } from '../utils/notImplemented'
import { taskSchema } from '../validators/task'

const router = Router()

router.get('/', notImplemented)
router.post('/', validate(taskSchema), notImplemented)
router.get('/:id', notImplemented)
router.put('/:id', validate(taskSchema), notImplemented)
router.delete('/:id', notImplemented)

export default router
