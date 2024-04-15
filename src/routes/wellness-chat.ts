import { markAllClientMessagesAsRead, markAllAsReplied, closeSessionFromAdvisor, setChatRoomToLive, closeSessionFromUser } from './../controllers/wellness-chat';
import { Router } from 'express'
import { jwtValidate } from '../middlewares/jwt-validate'
import {
  assignToMe,
  createChatRoom,
  getChatMode,
  getChatRoomOfLoggedInUser,
  getCurrentWaitTime,
  markAllAsRead,
  sendMessageFromAdvisor,
  sendMessageFromClient,
  updateChatMode,
  updateMessage,
} from '../controllers/wellness-chat'
import { adminJwtValidate, ROLES } from '../middlewares/admin-jwt-validate'
import { body } from 'express-validator'
import { fieldsValidate } from '../middlewares/fields-validate'

const router = Router()

/**
 * @swagger
 * definitions:
 *      MessageToAdvisor:
 *          type: object
 *          properties:
 *              text:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      WellnessChatMode:
 *          type: object
 *          properties:
 *              isChatActive:
 *                  type: boolean
 */

/**
 * @swagger
 * definitions:
 *      AdvisorMessage:
 *          type: object
 *          properties:
 *              text:
 *                  type: string
 *              chatRoomId:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      ChatRoomIdOnly:
 *          type: object
 *          properties:
 *              chatRoomId:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      UpdateMessage:
 *          type: object
 *          properties:
 *              chatRoomId:
 *                  type: string
 *              messageId:
 *                  type: string
 *              read:
 *                  type: boolean
 *              replied:
 *                  type: boolean
 */

/**
 * @swagger
 * /minitulip/wellness-chat/create:
 *      post:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Create a chat room between the logged in user and the wellness advisors. This message goes to pending tab on admin panel.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/MessageToAdvisor'
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
  '/create',
  jwtValidate,  
  createChatRoom
)

/**
 * @swagger
 * /minitulip/wellness-chat/chat-room:
 *      get:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: If the logged in user has a chat room with the wellness advisors, it returns the chat room. Otherwise, it returns null.
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
router.get('/chat-room', jwtValidate, getChatRoomOfLoggedInUser)

/**
 * @swagger
 * /minitulip/wellness-chat/wait-time:
 *      get:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Returns the estimated wait time (in seconds) for the logged in user to get a response from the wellness advisors.
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
router.get('/wait-time', jwtValidate, getCurrentWaitTime)

/**
 * @swagger
 * /minitulip/wellness-chat:
 *      post:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Send a message from the logged in user to the wellness advisors.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/MessageToAdvisor'
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
  '/',
  jwtValidate,
  [body('text', 'The message text is mandatory').not().isEmpty(), fieldsValidate],
  sendMessageFromClient
)

/**
 * @swagger
 * /minitulip/wellness-chat/advisor-message:
 *      post:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Send a message from the logged in wellness advisor to the user.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/AdvisorMessage'
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
  '/advisor-message',
  adminJwtValidate([ROLES.WELLNESS_ADVISOR]),
  [
    body('text', 'The message text is mandatory').not().isEmpty(),
    body('chatRoomId', 'The chat identifier is mandatory').not().isEmpty(),
    fieldsValidate,
  ],
  sendMessageFromAdvisor
)

router.post(
  '/close-session',
  adminJwtValidate([ROLES.WELLNESS_ADVISOR]),
  [ 
    body('chatRoomId', 'The chat identifier is mandatory').not().isEmpty(),
    fieldsValidate,
  ],
  closeSessionFromAdvisor
)

router.post(
  '/user-close-session',
  jwtValidate,
  closeSessionFromUser
)

router.post(
  '/set-to-live',
  jwtValidate,
  setChatRoomToLive
)

/**
 * @swagger
 * /minitulip/wellness-chat/assign-to-me:
 *      post:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Assign a chat room to the logged in wellness advisor.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/ChatRoomIdOnly'
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
  '/assign-to-me',
  adminJwtValidate([ROLES.WELLNESS_ADVISOR]),
  [body('chatRoomId', 'The chat identifier is mandatory').not().isEmpty(), fieldsValidate],
  assignToMe
)

/**
 * @swagger
 * /minitulip/wellness-chat/mark-all-as-read:
 *      post:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Used by the wellness advisor to mark all the messages as read.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/ChatRoomIdOnly'
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
  '/mark-all-as-read',
  adminJwtValidate([ROLES.WELLNESS_ADVISOR]),
  [body('chatRoomId', 'The chat identifier is mandatory').not().isEmpty(), fieldsValidate],
  markAllAsRead
)

router.post(
  '/mark-all-as-replied',
  adminJwtValidate([ROLES.WELLNESS_ADVISOR]),
  [body('chatRoomId', 'The chat identifier is mandatory').not().isEmpty(), fieldsValidate],
  markAllAsReplied
)

/**
 * @swagger
 * /minitulip/wellness-chat/mark-all-client-messages-as-read:
 *      post:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Used by clients to mark all the messages as read.
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
  '/mark-all-client-messages-as-read',
  jwtValidate,  
  markAllClientMessagesAsRead
)

/**
 * @swagger
 * /minitulip/wellness-chat/update-message:
 *      post:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Used by the wellness advisor to update the message. Marking it as read/unread and replied/unreplied.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/UpdateMessage'
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
  '/update-message',
  adminJwtValidate([ROLES.WELLNESS_ADVISOR]),
  [
    body('chatRoomId', 'The chat identifier is mandatory').not().isEmpty(),
    body('messageId', 'The message identifier is mandatory').not().isEmpty(),
    fieldsValidate,
  ],
  updateMessage
)

/**
 * @swagger
 * /minitulip/wellness-chat/chat-mode:
 *      post:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Used by admins to toggle between e-mail and chat mode.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/WellnessChatMode'
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
  '/chat-mode',
  adminJwtValidate([ROLES.ROOT_ADMIN]),
  [body('isChatActive', 'The isChatActive is mandatory').not().isEmpty(), fieldsValidate],
  updateChatMode
)

/**
 * @swagger
 * /minitulip/wellness-chat/chat-mode:
 *      get:
 *          tags:
 *              -   Wellness Advisor Chat Endpoints
 *          description: Get the current chat mode.
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              500:
 *                  description: Database error
 */
router.get('/chat-mode', getChatMode)

export default router
