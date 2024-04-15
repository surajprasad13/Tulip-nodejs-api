import { Router } from "express"
import { body } from "express-validator"
import {
	getUserData,
	getUserMessages,
	updateUser,
	getUserNotifications,
	updateNotificationStatus,
	uploadImage,
	getDownloadLink,
	updateSurveyStatus,
	getSurveyAnswers,
	fetchUserPlans,
} from "../controllers/user"
import { fieldsValidate } from "../middlewares/fields-validate"
import { upload } from "../utils"
import { jwtValidate } from "../middlewares/jwt-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      SurveyStatus:
 *          type: object
 *          properties:
 *              status_enum:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      UserUpdate:
 *          type: object
 *          properties:
 *              first_name:
 *                  type: string
 *              last_name:
 *                  type: string
 *              dob:
 *                  type: string
 *              sex:
 *                  type: string
 *              phone:
 *                  type: string
 *              address_line1:
 *                  type: string
 *              address_line2:
 *                  type: string
 *              address_city:
 *                  type: string
 *              address_zip:
 *                  type: string
 *              address_country:
 *                  type: string
 *              communication_preference:
 *                  type: string
 *              timezone:
 *                  type: string
 *
 *      NotificationId:
 *          type: object
 *          properties:
 *              notification_id:
 *                  type: string
 *
 *      Avatar:
 *         type: object
 *         properties:
 *            userId:
 *             type: number
 *            avatar:
 *              type: file
 *
 *
 */

/**
 * @swagger
 * /minitulip/user/getUser:
 *      get:
 *          tags:
 *              -   User Endpoints
 *          description: Get user details and profile data
 *
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

router.get("/getUser", getUserData)

/**
 * @swagger
 * /minitulip/user/getSurveyAnswers:
 *      get:
 *          tags:
 *              -   User Endpoints
 *          description: get all answers from the user from the LAST survey.
 *
 *          responses:
 *              200:
 *                  description: Success
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

router.get("/getSurveyAnswers", getSurveyAnswers)

/**
 * @swagger
 * /minitulip/user/updateUser:
 *      put:
 *          tags:
 *             -   User Endpoints
 *          description: Update users detail
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/UserUpdate'
 *
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
router.put("/updateUser", updateUser)

/**
 * @swagger
 * /minitulip/user/avatar:
 *      post:
 *          tags:
 *             -   User Endpoints
 *          description: Update users profile image
 *          requestBody:
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#definitions/Avatar'
 *
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

router.post("/avatar", upload.single("avatar"), uploadImage)

/**
 * @swagger
 * /minitulip/user/getUserMessages:
 *      get:
 *          tags:
 *             -   User Endpoints
 *          description: Get plans from database
 *
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

router.get("/getUserMessages", getUserMessages)

/**
 * @swagger
 * /minitulip/user/getNotifications:
 *      get:
 *          tags:
 *             -   User Endpoints
 *          description: Get users notifications from database
 *          parameters:
 *              -   in: query
 *                  name: limit
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  description: Limit for fetching data default is 10
 *              -   in: query
 *                  name: offset
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  optional: true
 *                  description: Offset number default is 0
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

router.get("/getNotifications", getUserNotifications)

/**
 * @swagger
 * /minitulip/user/updateNotificationStatus:
 *      put:
 *          tags:
 *             -   User Endpoints
 *          description: Update users notification status
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/NotificationId'
 *
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

router.put("/updateNotificationStatus", updateNotificationStatus)

/**
 * @swagger
 * /minitulip/user/getDownloadLink:
 *      get:
 *          tags:
 *             -   User Endpoints
 *          description: Get download link after completing the survey
 *          responses:
 *              200:
 *                  description: Link information returned successfully
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

router.get("/getDownloadLink", getDownloadLink)

/**
 * @swagger
 * /minitulip/user/survey-status:
 *      post:
 *          tags:
 *              -   User Endpoints
 *          description: Update survey status of the logged-in user
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/SurveyStatus'
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
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
router.post(
	"/survey-status",
	[
		body("status_enum", "The Status Enum is mandatory").not().isEmpty(),
		body("status_enum", "The Status Enum must be string").isString(),
		fieldsValidate,
	],
	jwtValidate,
	updateSurveyStatus
)

/**
 * @swagger
 * /minitulip/user/plans:
 *      get:
 *          tags:
 *              -   User Endpoints
 *          description: Get user purchased and subscribed plans
 *
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

router.get("/plans", fetchUserPlans)

export default router
