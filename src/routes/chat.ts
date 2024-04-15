import { Router } from "express"
import { query, body, param } from "express-validator"
import {
	getSingleUser,
	getQuestion,
	getChatBot,
	getAllQuestions,
	postAnswers,
	getSuggestedMedications,
	getMedicationsByIds,
	resetId,
	getSmartInteraction,
	getSuggestedAllergies,
	getAllergiesByIds
} from "../controllers/chat"
import { fieldsValidate } from "../middlewares/fields-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      Answers:
 *          type: object
 *          properties:
 *              data:
 *                  type: string
 *              answers:
 *                  type: string
 *              bubble_counters:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      Bot:
 *          type: object
 *          properties:
 *              message:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      Medications:
 *          type: object
 *          properties:
 *              text:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      MedicationsIds:
 *          type: object
 *          properties:
 *              ids:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      Allergies:
 *          type: object
 *          properties:
 *              text:
 *                  type: string
 *              food:
 *                  type: boolean
 */

/**
 * @swagger
 * definitions:
 *      AllergiesIds:
 *          type: object
 *          properties:
 *              ids:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/chat:
 *      get:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get all answers from a single users
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
router.get("/", getSingleUser)

/**
 * @swagger
 * /minitulip/chat/getQuestion:
 *      get:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get current user's question
 *          parameters:
 *              -   in: query
 *                  name: id_question
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The ID of the current question
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
 *                  description: Query Params missing or invalid
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
router.get(
	"/getQuestion",
	[
		query("id_question", "The ID of the question is mandatory").not().isEmpty(),
		query("id_question", "The ID of the question must be numeric").isNumeric(),
		query("group_id", "The Group ID is mandatory").not().isEmpty(),
		query("group_id", "The Group ID must be numeric").isNumeric(),
		fieldsValidate,
	],
	getQuestion
)

/**
 * @swagger
 * /minitulip/chat/getChatBot:
 *      post:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get Bot Response
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Bot'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: Field message is mandatory
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
router.post("/getChatBot", [body("message", "The message is mandatory").not().isEmpty(), fieldsValidate], getChatBot)

/**
 * @swagger
 * /minitulip/chat:
 *      get:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get all answers from a single users
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

router.get("/", getSingleUser)

/**
 * @swagger
 * /minitulip/chat/getAllQuestions:
 *      get:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get All questions
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

router.get("/getAllQuestions", getAllQuestions)

/**
 * @swagger
 * /minitulip/chat/postAnswers:
 *      post:
 *          tags:
 *              -   Chat Endpoints
 *          description: Store User's answers
 *          parameters:
 *              -   in: query
 *                  name: group_id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The Group ID number
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Answers'
 *          responses:
 *              200:
 *                  description: User's answers saved
 *              400:
 *                  description: Query Param missing or invalid. Field data is mandatory and must be in JSON format
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
	"/postAnswers",
	[
		query("group_id", "The Group ID is mandatory").not().isEmpty(),
		query("group_id", "The Group ID must be numeric").isNumeric(),
		fieldsValidate,
	],
	postAnswers
)

/**
 * @swagger
 * /minitulip/chat/smart-interaction:
 *      get:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get smart interaction
 *          parameters:
 *              -   in: query
 *                  name: group_id
 *                  schema:
 *                      type: number
 *                  description: The Group ID number
 *                  required: true
 *              -   in: query
 *                  name: question_id
 *                  schema:
 *                      type: number
 *                  description: The question ID number
 *                  required: true
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: Query Params missing or invalid
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
	'/smart-interaction',
	// [
	//   query('group_id', 'The Group ID is mandatory').not().isEmpty(),
	//   query('group_id', 'The Group ID must be numeric').isNumeric(),
	//   query('question_id', 'The question ID is mandatory').not().isEmpty(),
	//   query('question_id', 'The question ID must be numeric').isNumeric(),
	//   fieldsValidate,
	// ],
	getSmartInteraction
  )
/**
 * @swagger
 * /minitulip/chat/{group_id}:
 *      get:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get all answers from a single users
 *          parameters:
 *              -   in: path
 *                  name: group_id
 *                  schema:
 *                      type: number
 *                  description: 101 for Sleep. 102 for Fatigue. 103 for Blood Sugar. 104 for Long Covid. 105 for Free Long Covid.
 *                  required: true
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: The group id is mandatory
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
router.get("/:group_id", [param("group_id", "The Group ID must be numeric").isNumeric(), fieldsValidate], getSingleUser)

/**
 * @swagger
 * /minitulip/chat/suggestedMedications:
 *      post:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get a List of Medications
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Medications'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: Field text is mandatory
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
	"/suggestedMedications",
	[body("text", "The text is mandatory and must has a minimum of 3 characters").isLength({ min: 3 }), fieldsValidate],
	getSuggestedMedications
)


/**
 * @swagger
 * /minitulip/chat/listMedications:
 *      post:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get a List of Medications based on Ids
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/MedicationsIds'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: Field ids field is mandatory
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
	"/listMedications",
	[
		body("ids", "The ids field is mandatory and must have medication ids separate by comas").not().isEmpty(), 
		fieldsValidate
	],
	getMedicationsByIds
)

/**
 * @swagger
 * /minitulip/chat/listAllergies:
 *      post:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get a List of Allergies based on Ids
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/AllergiesIds'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: Field ids field is mandatory
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
	"/listAllergies",
	[
		body("ids", "The ids field is mandatory and must have medication ids separate by comas").not().isEmpty(), 
		fieldsValidate
	],
	getAllergiesByIds
)

/**
 * @swagger
 * /minitulip/chat/reset:
 *      delete:
 *          tags:
 *              -   Chat Endpoints
 *          description: Caution. Endpoint for deleting all answers and medications of a single user.
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
 router.delete(
	"/reset",
	[
		fieldsValidate
	],
	resetId
)

/**
 * @swagger
 * /minitulip/chat/suggestedAllergies:
 *      post:
 *          tags:
 *              -   Chat Endpoints
 *          description: Get a List of Allergies
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Allergies'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: Fields text and food are mandatory
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
	"/suggestedAllergies",
	[
		body("text", "The text is mandatory and must has a minimum of 3 characters").isLength({ min: 3 }), 
		body("food", "The filter is mandatory").not().isEmpty(),
		body("food", "The filter must be boolean").isBoolean(),
		fieldsValidate
	],
	getSuggestedAllergies
)

export default router
