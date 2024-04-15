import { Router } from "express"
import { sendMessageOnDevice, sendSurveyNotification } from "../controllers/firebase"

const router = Router()

/**
 * @swagger
 * definitions:
 *      User_id:
 *          type: object
 *          properties:
 *              user_id:
 *                  type: string
 *
 */

/**
 * @swagger
 * /minitulip/firebase/sendMessage:
 *      post:
 *          tags:
 *              -   Firebase Endpoints
 *          description: Get all answers from a single users
 *          responses:
 *              200:
 *                  description: Success
 */

router.post("/sendMessage", sendMessageOnDevice)

/**
 * @swagger
 * /minitulip/firebase/sendSurveyNotification:
 *      post:
 *          tags:
 *              -   Firebase Endpoints
 *          description: Get all answers from a single users
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/User_id'
 *          responses:
 *              200:
 *                  description: Success
 */

router.post("/sendSurveyNotification", sendSurveyNotification)

export default router
