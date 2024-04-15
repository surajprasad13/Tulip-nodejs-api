
import { Router } from "express"
import { body } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { postSymptom, getSymptom } from "../controllers/symptoms/symptoms"
import { getSymptomsInsights } from "../controllers/symptoms/insights"
import { getMMPdf } from "../controllers/symptoms/mmpdf"
import { jwtValidate } from "../middlewares/jwt-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      TreeSymp:
 *          type: object
 *          properties:
 *              symptom:
 *                  type: integer
 *              start_date: 
 *                  type: string
 *              duration:
 *                  type: integer
 *              severity:
 *                  type: integer
 *              triggers:
 *                  type: string
 *              medications:
 *                  type: string
 *              stress_level:
 *                  type: integer
 *              notes:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      SympList:
 *          type: object
 *          properties:
 *              symptoms:
 *                  type: array
 *                  items:
 *                      type: integer
 */

/**
 * @swagger
 * /minitulip/symptoms:
 *      post:
 *          tags:
 *              -   Symptoms Endpoints
 *          description: save single user symptom
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/TreeSymp'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: There are missing mandatory fields
 *              401:
 *                  description: Invalid Tokens
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
	jwtValidate,
	[
		body("symptom", "The Symptom is mandatory").not().isEmpty(),
		body("symptom", "The Symptom must be numeric").isNumeric(),
        body("severity", "The Severity is mandatory").not().isEmpty(),
		body("severity", "The Severity must be numeric").isNumeric(),
        body("stress_level", "The Stress Level is mandatory").not().isEmpty(),
		body("stress_level", "The Stress Level must be numeric").isNumeric(),
		body("start_date", "The Start Date is mandatory").not().isEmpty(),
		body("duration", "The Duration is mandatory").not().isEmpty(),
		body("duration", "The Duration must be numeric").isNumeric(),
		fieldsValidate,
	],
    postSymptom
)

/**
 * @swagger
 * /minitulip/symptoms:
 *      get:
 *          tags:
 *              -   Symptoms Endpoints
 *          description: Get symptoms time series
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: User does not have symptoms tracked
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
	jwtValidate,
	getSymptom
)

/**
 * @swagger
 * /minitulip/symptoms/insights:
 *      get:
 *          tags:
 *              -   Symptoms Endpoints
 *          description: Get symptom insights of a user (goes to python api)
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: User does not have symptoms tracked
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
	"/insights",
	jwtValidate,
	getSymptomsInsights 
)

/**
 * @swagger
 * /minitulip/symptoms/mmpdf:
 *      post:
 *          tags:
 *              -   Symptoms Endpoints
 *          description: Get information from mmpdf table
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/SympList'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: There are missing mandatory fields
 *              401:
 *                  description: Invalid Tokens
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
	"/mmpdf",
	[
		body("symptoms", "The Symptoms is a mandatory list").isArray().not().isEmpty(),
		body("symptoms.*", "Each symptom must be an integer").isNumeric(),
		fieldsValidate,
	],
    getMMPdf
)

export default router
