import { Router } from 'express'
import { createSubject, deleteSubject, listSubjects, updateSubject } from '../controllers/subject.controller'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { subjectSchema } from '../validators/subject'

const router = Router()
router.use(requireAuth)

router.get('/', listSubjects)
router.post('/', validate(subjectSchema), createSubject)
router.put('/:id', validate(subjectSchema), updateSubject)
router.delete('/:id', deleteSubject)

export default router
