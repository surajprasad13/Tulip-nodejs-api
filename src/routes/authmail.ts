import { Router } from "express"
import { removeNewsLetter } from "../controllers/mail"

const router = Router()

/**
 * @swagger
 * /minitulip/authmail:
 *      post:
 *          tags:
 *              -   Auth Mail Endpoints
 *          description: Remove email for newsletter
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              500:
 *                  description: Database error
 *          security:
 *          -   access_token: []
 */

router.delete(
    '/',
    removeNewsLetter
)

export default router