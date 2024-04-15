import { Router } from "express"
import { getDeficiency } from "../controllers/contra-defi/deficiency"

const router = Router()

/**
 * @swagger
 * /minitulip/deficiency:
 *      get:
 *          tags:
 *              -   Remedy Endpoints
 *          description: Get nutricional deficiencies for a user based on his/her medications.
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: User does not have medications
 *              500:
 *                  description: Database error
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */
router.get(
	"/",
	getDeficiency
)

export default router
