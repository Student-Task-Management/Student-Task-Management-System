import { Router } from 'express'
import { validate } from '../middleware/validate'
import { notImplemented } from '../utils/notImplemented'
import { subjectSchema } from '../validators/subject'

const router = Router()

router.get('/', notImplemented)
router.post('/', validate(subjectSchema), notImplemented)
router.put('/:id', validate(subjectSchema), notImplemented)
router.delete('/:id', notImplemented)

export default router
