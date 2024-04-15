import { Router } from "express"
import { query, body, param } from "express-validator"
import { getModelInsights, getPrivatePreview, getRootCause, getConstitution } from "../controllers/insights"
import { fieldsValidate } from "../middlewares/fields-validate"
import { jwtValidate } from "../middlewares/jwt-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      Trees2:
 *          type: object
 *          properties:
 *              group_id:
 *                  type: integer
 */

/**
 * @swagger
 * /minitulip/insights/model:
 *      post:
 *          tags:
 *              -   Remedy Endpoints
 *          description: 101 for Sleep. 102 for Fatigue. 103 for Blood Sugar. 104 for Long Covid. 105 for Free Long Covid
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Trees2'
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
	"/model",
	[
		body("group_id", "The Group ID is mandatory").not().isEmpty(),
		body("group_id", "The Group ID must be numeric").isNumeric(),
		fieldsValidate,
	],
	getModelInsights
)

/**
 * @swagger
 * /minitulip/insights/privatePreview:
 *      post:
 *          tags:
 *              -   Remedy Endpoints
 *          description: the a private preview (a.k.a. teaser insights) for the user. The survey must be associated with the lead in this case.
 *          parameters:
 *              -   in: query
 *                  name: group_id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The Group ID number of the current question
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: The group id is mandatory
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
	"/privatePreview",
	[param("group_id", "The Group ID must be numeric").isNumeric()],
	jwtValidate,
	getPrivatePreview
)

/**
 * @swagger
 * /minitulip/insights/rootCause:
 *      post:
 *          tags:
 *              -   Remedy Endpoints
 *          description: 101 for Sleep. 102 for Fatigue. 103 for Blood Sugar. 104 for Long Covid. 105 for Free Long Covid
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Trees2'
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
	"/rootCause",
	[
		body("group_id", "The Group ID is mandatory").not().isEmpty(),
		body("group_id", "The Group ID must be numeric").isNumeric(),
		fieldsValidate,
	],
	getRootCause
)

/**
 * @swagger
 * /minitulip/insights/constitution:
 *      post:
 *          tags:
 *              -   Remedy Endpoints
 *          description: 101 for Sleep. 102 for Fatigue. 103 for Blood Sugar. 104 for Long Covid. 105 for Free Long Covid 106 for Ayurvedic TCM
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              group_id:
 *                                  type: integer
 *                                  description: The ID of the group.
 *                              user_answers:
 *                                  type: array
 *                                  items:
 *                                      type: object
 *                                      properties:
 *                                          question_id:
 *                                              type: string
 *                                              description: The ID of the question as a string.
 *                                          values:
 *                                              type: string
 *                                              description: The values associated with the question ID as a string.
 *                                  description: An array of user answer objects.
 *                          required:
 *                              - group_id
 *                              - user_answers
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
 */
router.post(
    "/constitution",
    [
        body("group_id", "The Group ID is mandatory").not().isEmpty(),
        body("group_id", "The Group ID must be numeric").isNumeric(),
        body("user_answers", "User Answers is mandatory and must be an array").isArray(),
        body("user_answers.*.question_id", "Question ID is mandatory").isString(),
        body("user_answers.*.values", "Values are mandatory").isString(),
        fieldsValidate,
    ],
    getConstitution
)


export default router
