import { Router } from "express"
import { body } from "express-validator"
import { getMainDashboard } from "../controllers/dashboard"
import { fieldsValidate } from "../middlewares/fields-validate"
import { jwtValidate } from "../middlewares/jwt-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      Trees3:
 *          type: object
 *          properties:
 *              group_id:
 *                  type: integer
 */

/**
 * @swagger
 * /minitulip/dashboard:
 *      post:
 *          tags:
 *              -   Dashboard Endpoints
 *          description: Get dashboard information for a specific user. id_group 101 for Sleep. 102 for Fatigue. 103 for Blood Sugar. 104 for Long Covid. 105 for Free Long Covid
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Trees3'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: The group id is mandatory
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: User does not have answers
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
router.post(
	"/",
	[
		body("group_id", "The Group ID is mandatory").not().isEmpty(),
		body("group_id", "The Group ID must be numeric").isNumeric(),
        jwtValidate,
		fieldsValidate,
	],
	getMainDashboard
)

export default router
