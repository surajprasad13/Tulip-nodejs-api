import { Request, Response, NextFunction, Router } from "express"
import {
	getAttachment,
	getMessages,
	postMessage,
	doctorReply,
	createChatRoom,
	listDoctorsAndUnrepliedMessages,
	listChatRooms,
} from "../controllers/doctor-chat"
import { jwtValidate } from "../middlewares/jwt-validate"
import multer from "multer"
import { body, param } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { adminJwtValidate, adminOrUserJwtValidate, ROLES } from "../middlewares/admin-jwt-validate"
import {
	doctorMarkAllMessagesAsRead,
	doctorUpdateMessage,
	listAllChats,
	listAllPendingMessages,
	listChats,
	listMessages,
	listPendingChats,
} from "../controllers/admin/doctor-chat"
import { verify } from "jsonwebtoken"
import config from "../config"

const router = Router()

const attachmentJwtValidate = async (req: Request, res: Response, next: NextFunction) => {
	const token = (req.params.token ?? "").replace("Bearer", "").trim()

	if (!token) {
		return res.status(401).json({
			message: `Token is mandatory`,
		})
	}

	try {
		const payload = verify(token, config.JWT_PRIVATE_KEY ?? " ")
		req.body.payload = payload
	} catch (err) {
		return res.status(401).json({
			message: `Invalid Token`,
		})
	}

	next()
}

/**
 * @swagger
 * definitions:
 *      Message:
 *          type: object
 *          properties:
 *              text:
 *                  type: string
 *              attachment:
 *                  type: string
 *                  format: binary
 */

/**
 * @swagger
 * definitions:
 *      DoctorMessage:
 *          type: object
 *          properties:
 *              text:
 *                  type: string
 *              attachment:
 *                  type: string
 *                  format: binary
 *              chatRoomId:
 *                  type: number
 */

/**
 * @swagger
 * /minitulip/doctor-chat/create:
 *      post:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: Send the first message from logged-in user to doctors. This message goes to pending tab on admin panel.
 *          requestBody:
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#definitions/Message'
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

router.post(
	"/create",
	jwtValidate,
	multer({
		limits: {
			fileSize: 25000000, //25MB
		},
	}).single("attachment"),
	createChatRoom
)

/**
 * @swagger
 * /minitulip/doctor-chat/doctor-reply:
 *      post:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: Send messages from logged-in doctor to users
 *          requestBody:
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#definitions/DoctorMessage'
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
router.post(
	"/doctor-reply",
	adminJwtValidate([ROLES.DOCTOR]),
	multer({
		limits: {
			fileSize: 25000000, //25MB
		},
	}).single("attachment"),
	[
		body("chatRoomId", "The chat identifier is mandatory").not().isEmpty(),
		body("chatRoomId", "The chat identifier must be numeric").isNumeric(),
		fieldsValidate,
	],
	doctorReply
)

/**
 * @swagger
 * /minitulip/doctor-chat/doctor-reply/{id}:
 *      post:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: Send messages from logged-in doctor to users, replying to specific message
 *          requestBody:
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#definitions/DoctorMessage'
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: number
 *                  description: The message identifier
 *                  required: true
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
router.post(
	"/doctor-reply/:id",
	adminJwtValidate([ROLES.DOCTOR]),
	multer({
		limits: {
			fileSize: 25000000, //25MB
		},
	}).single("attachment"),
	[
		body("chatRoomId", "The chat identifier is mandatory").not().isEmpty(),
		body("chatRoomId", "The chat identifier must be numeric").isNumeric(),
		fieldsValidate,
	],
	doctorReply
)

/**
 * @swagger
 * /minitulip/doctor-chat/{id}:
 *      post:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: Send messages from logged-in user to doctors using a specific chat room.
 *          requestBody:
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#definitions/Message'
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The chat room identifier
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

router.post(
	"/:id",
	jwtValidate,
	[
		param("id", "The chat room identifier is mandatory").not().isEmpty(),
		param("id", "The chat room identifier must be numeric").isNumeric(),
		fieldsValidate,
	],
	multer({
		limits: {
			fileSize: 25000000, //25MB
		},
	}).single("attachment"),
	postMessage
)

/**
 * @swagger
 * /minitulip/doctor-chat/attachment/{id}:
 *      get:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: Get the attachment of a message
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The message identifier
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Attachment not found
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
	"/attachment/:id",
	adminOrUserJwtValidate,
	[
		param("id", "The attachment identifier is mandatory").not().isEmpty(),
		param("id", "The attachment identifier must be numeric").isNumeric(),
		fieldsValidate,
	],
	getAttachment
)

/**
 * @swagger
 * /minitulip/doctor-chat/attachment/{id}/{token}:
 *      get:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: Get the attachment of a message
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The message identifier
 *              -   in: path
 *                  name: token
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: JWT token
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Attachment not found
 *              500:
 *                  description: Database error
 */

router.get(
	"/attachment/:id/:token",
	attachmentJwtValidate,
	[
		param("id", "The attachment identifier is mandatory").not().isEmpty(),
		param("token", "The token is mandatory").not().isEmpty(),
		param("id", "The attachment identifier must be numeric").isNumeric(),
		fieldsValidate,
	],
	getAttachment
)

/**
 * @swagger
 * /minitulip/doctor-chat/messages/{id}:
 *      get:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: Get all messages from the specific chat room.
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: number
 *                  description: The chat room identifier
 *                  required: true
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Messages not found
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

router.get("/messages/:id", jwtValidate, getMessages)

/**
 * @swagger
 * /minitulip/doctor-chat/doctors:
 *      get:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: List all doctors that have replied at least one message from the logged-in user also list all unreplied messages.
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
router.get("/doctors", jwtValidate, listDoctorsAndUnrepliedMessages)

/**
 * @swagger
 * /minitulip/doctor-chat/doctors/{id}:
 *      get:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: List all chat rooms between the logged-in user and one specific doctor.
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: number
 *                  description: The doctor identifier
 *                  required: true
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
router.get("/doctors/:id", jwtValidate, listChatRooms)

/**
 * @swagger
 * /minitulip/doctor-chat/list-chats:
 *      get:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: List all chats
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Messages not found
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

router.get("/list-chats", adminJwtValidate([ROLES.DOCTOR]), listChats)

router.get("/list-pending-chats", adminJwtValidate([ROLES.DOCTOR]), listPendingChats)

/**
 * @swagger
 * /minitulip/doctor-chat/list-messages/{id}:
 *      get:
 *          tags:
 *              -   Doctor Chat Endpoints
 *          description: List all messages for one specific chat
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: number
 *                  description: The chat identifier
 *                  required: true
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Messages not found
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
router.get("/list-messages/:id", adminJwtValidate([ROLES.DOCTOR]), listMessages)

router.post("/doctor-mark-all-as-read/:id", adminJwtValidate([ROLES.DOCTOR]), doctorMarkAllMessagesAsRead)

router.post("/doctor-update-message/:id", adminJwtValidate([ROLES.DOCTOR]), doctorUpdateMessage)

router.get("/list-all-chats", adminJwtValidate([ROLES.ROOT_ADMIN]), listAllChats)

router.get("/list-all-pending-messages", adminJwtValidate([ROLES.DOCTOR]), listAllPendingMessages)

export default router
