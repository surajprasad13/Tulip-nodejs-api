import { Express, Request, Response, Router } from "express"
import { fetchPlans } from "../controllers/plans"

const router = Router()

/**
 * @swagger
 * /minitulip/plans:
 *      get:
 *          tags:
 *             -   Plans Endpoints
 *          description: Get All plans from database
 *          parameters:
 *              -   in: query
 *                  name: limit
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  description: Limit for fetching data default is 10
 *              -   in: query
 *                  name: offset
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  optional: true
 *                  description: Offset number default is 0
 *          responses:
 *              200:
 *                  description: Plans information returned successfully
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

router.get("/", fetchPlans)

export default router
