import { Router } from "express"
import { getPkce } from "../controllers/fitbit"

const router = Router()

/**
 * @swagger
 * /minitulip/fitbit/getPkce:
 *      get:
 *          tags:
 *              -   Fitbit Endpoints
 *          description: Get fitbit code challenge and code verifier details
 *
 *          responses:
 *              200:
 *                  description: Fitbit information returned successfully
 *              400:
 *                  description: Not found
 *              401:
 *                  description: Invalid Token
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */

router.get("/getPkce", getPkce)

export default router
