import { Router } from "express"
import { body } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { getContraDefi, getSavedContraDefi } from "../controllers/contra-defi/contradefi"
import { getContra } from "../controllers/contra-defi/contraindications"

const router = Router()

/**
 * @swagger
 * definitions:
 *      MediList:
 *          type: object
 *          properties:
 *              medication_list:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/contraindications:
 *      get:
 *          tags:
 *              -   Remedy Endpoints
 *          description: Get contraindications for a user based on his/her medications.
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
	getContra
)

/**
 * @swagger
 * /minitulip/contraindications/deficiency:
 *      post:
 *          tags:
 *              -   Remedy Endpoints
 *          description: Get contraindications for a user based on a list of medications
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/MediList'
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Invalid List of Medications
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
	"/deficiency",
	[
		body("medication_list", "The medication_list field is mandatory and must have medication ids separate by comas").not().isEmpty(), 
		fieldsValidate
	],
	getContraDefi
)

/**
 * @swagger
 * /minitulip/contraindications/deficiency:
 *      get:
 *          tags:
 *              -   Remedy Endpoints
 *          description: Get saved contraindications for a specific user
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
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
	"/deficiency",
	getSavedContraDefi
)

export default router