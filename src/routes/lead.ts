import { Router } from "express"
import { createLead } from "../controllers/lead"
import { body, param } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { getAllLeads, updateLeadStatus } from "../controllers/admin/lead"
import { adminJwtValidate, ROLES } from "../middlewares/admin-jwt-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      Lead:
 *          type: object
 *          properties:
 *              userFirstName:
 *                  type: string
 *              userEmail:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      LeadStatusUpdate:
 *          type: object
 *          properties:
 *              status:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/leads/createLead:
 *      post:
 *          tags:
 *              -   Lead Endpoints
 *          description: Create leads
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Lead'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: The User First Name and User Email are mandatory
 *              401:
 *                  description: Invalid Token
 *              500:
 *                  description: Database error
 */
router.post(
	"/createLead",
	[
		body("userFirstName", "The User First Name is mandatory").not().isEmpty(),
		body("userFirstName", "The User First Name must be string").isString(),
		body("userEmail", "The User Email is mandatory").not().isEmpty(),
		body("userEmail", "The User Email must be string").isEmail(),
		fieldsValidate,
	],
	createLead
)

/**
 * @swagger
 * /minitulip/leads/getAllLeads:
 *      get:
 *          tags:
 *              -   Lead Endpoints
 *          description: Get all leads
 *          parameters:
 *              -   in: query
 *                  name: limit
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  description: Limit the number of results. Default is 20
 *              -   in: query
 *                  name: offset
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  description: Offset of results. Default is 0
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Leads not found
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */

router.use("/getAllLeads", adminJwtValidate([ROLES.ROOT_ADMIN]))
router.get("/getAllLeads", getAllLeads)

/**
 * @swagger
 * /minitulip/leads/updateLeadStatus/{id}:
 *      post:
 *          tags:
 *              -   Lead Endpoints
 *          description: Update lead status
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: Lead id
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/LeadStatusUpdate'
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Leads not found
 *              400:
 *                  description: invalid params
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */
router.use("/updateLeadStatus", adminJwtValidate([ROLES.ROOT_ADMIN]))
router.post(
	"/updateLeadStatus/:id",
	[
		body("status", "The status is mandatory").not().isEmpty(),
		param("id", "The lead identifier is mandatory").not().isEmpty(),
		param("id", "The lead identifier must be numeric").isNumeric(),
		fieldsValidate,
	],
	updateLeadStatus
)

export default router
