import { Router } from 'express'
import { isSubscribed, subscribe, unsubscribe } from '../controllers/health-tips-subscription'
const router = Router()

/**
 * @swagger
 * /minitulip/health-tips/subscribe:
 *      post:
 *          tags:
 *             -   Health tips Subscriptions
 *          description: subscribe to helth tips
 *          responses:
 *              200:
 *                  description: success
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

router.post('/subscribe', subscribe)

/**
 * @swagger
 * /minitulip/health-tips/unsubscribe:
 *      post:
 *          tags:
 *             -   Health tips Subscriptions
 *          description: unsubscribe to health tips
 *          responses:
 *              200:
 *                  description: success
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

router.post('/unsubscribe', unsubscribe)

/**
 * @swagger
 * /minitulip/health-tips/is-subscribed:
 *      get:
 *          tags:
 *             -   Health tips Subscriptions
 *          description: check if user is subscribed to health tips
 *          responses:
 *              200:
 *                  description: success
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

router.get('/is-subscribed', isSubscribed)

export default router
