import { Router } from 'express'
import {
  fetchUsers,
  getContraindications,
  getQuestions,
  getUser,
  getUserDeficiency,
  getUserRemedies,
} from '../../controllers/admin/users'

const router = Router()

router.get('/questions', getQuestions)

router.get('/:id', getUser)

router.get('/', fetchUsers)

router.post('/:id/remedies', getUserRemedies)

router.get('/:id/deficiency', getUserDeficiency)

router.get('/:id/contraindications', getContraindications)

export default router
