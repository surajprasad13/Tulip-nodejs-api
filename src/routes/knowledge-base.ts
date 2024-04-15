import { Router } from "express"
import { body } from "express-validator"
import { AskHistoryGet, RasaMessageSend } from "../controllers/knowledge-base"
import { fieldsValidate } from "../middlewares/fields-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      messageSend:
 *          type: object
 *          properties:
 *              sender:
 *                  type: string
 *              message:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/knowledgebase/ask:
 *      post:
 *          tags:
 *              - Knowledge base
 *          description: answer queries from the user
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/messageSend'
 *          responses:
 *              200:
 *                  description: Success
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
router.post(
	"/ask",
	[
		body("sender", "The 'sender' parameter is mandatory").not().isEmpty(),
		body("message", "The 'message' parameter is mandatory").not().isEmpty(),
		fieldsValidate,
	],
	RasaMessageSend
)


/**
 * @swagger
 * /minitulip/knowledgebase/ask-history:
 *      get:
 *          tags:
 *              - Knowledge base
 *          description: get all questions from the user
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

 router.get("/ask-history", AskHistoryGet)

export default router