import { Router } from "express"
import { query, body, param } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { upload } from "../utils"
import {
	postSmartLifestyle,
	postSmartPopup,
	postSmartFood,
} from "../controllers/content-generation"
import { jwtValidate } from "../middlewares/jwt-validate"
import { jwtValidate as jwtValidate2 } from "../middlewares/jwt-validate-temp-session"

const router = Router()

/**
 * @swagger
 * /minitulip/content-generation/smart-popup:
 *      post:
 *          tags:
 *             -   Content Generation
 *          description: smart popup
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/WellnessAdvisorChatHistory'
 *          responses:
 *              200:
 *                  description: image succesfully uploaded
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

router.post("/smart-popup",
	[
		// body('history', 'the history of the chat is mandatory').not().isEmpty(),
		fieldsValidate,
	],
	jwtValidate2,
	postSmartPopup)


/**
 * @swagger
 * /minitulip/content-generation/lifestyle-intro:
 *      post:
 *          tags:
 *             -   Content Generation
 *          description: lifestyle intro
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/WellnessAdvisorChatHistory'
 *          responses:
 *              200:
 *                  description: image succesfully uploaded
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

router.post("/lifestyle-intro",
	[
		// body('history', 'the history of the chat is mandatory').not().isEmpty(),
		fieldsValidate,
	],
	jwtValidate,
	postSmartLifestyle)


/**
 * @swagger
 * /minitulip/content-generation/food-intro:
 *      post:
 *          tags:
 *             -   Content Generation
 *          description: food intro
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/WellnessAdvisorChatHistory'
 *          responses:
 *              200:
 *                  description: image succesfully uploaded
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

router.post("/food-intro",
	[
		// body('history', 'the history of the chat is mandatory').not().isEmpty(),
		fieldsValidate,
	],
	jwtValidate,
	postSmartFood)

export default router