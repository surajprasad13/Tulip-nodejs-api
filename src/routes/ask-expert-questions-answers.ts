import { jwtValidate } from './../middlewares/jwt-validate-temp-session';
import { Router } from "express"
import { body, param } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { adminJwtValidate, ROLES } from "../middlewares/admin-jwt-validate"
import { createQuestion, getAllQuestions, updateQuestion } from "../controllers/ask-expert-questions-answers"

const router = Router()

/**
 * @swagger
 * definitions:
 *      CreateQuestion:
 *          type: object
 *          properties:
 *              category:
 *                  type: string
 *              question:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/ask-expert/create:
 *      post:
 *          tags:
 *              -   Ask An Expert Endpoints
 *          description: Create questions
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/CreateQuestion'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: The question and category are mandatory
 *              401:
 *                  description: Invalid Token
 *              500:
 *                  description: Database error
 */
router.post(
	"/create",
	jwtValidate,
	[
		body("question", "The question is mandatory").not().isEmpty(),
		body("question", "The question must be string").isString(),
		body("category", "The category is mandatory").not().isEmpty(),
		body("category", "The category must be string").isString(),
		fieldsValidate,
	],
	createQuestion
)

router.get(
	"/",
	adminJwtValidate([ROLES.WELLNESS_ADVISOR]),
	getAllQuestions
)

router.post(
	"/",
	adminJwtValidate([ROLES.WELLNESS_ADVISOR]),
	updateQuestion
)

export default router
