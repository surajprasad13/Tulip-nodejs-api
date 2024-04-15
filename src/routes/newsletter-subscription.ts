import { subscribe, unsubscribe, isSubscribed } from './../controllers/newsletter-subscription'
import { Router } from 'express'
const router = Router()

/**
 * @swagger
 * /minitulip/newsletter/subscribe:
 *      post:
 *          tags:
 *             -   Newsletter Subscriptions
 *          description: subscribe to newsletter
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
 * /minitulip/newsletter/unsubscribe:
 *      post:
 *          tags:
 *             -   Newsletter Subscriptions
 *          description: unsubscribe to newsletter
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
 * /minitulip/newsletter/is-subscribed:
 *      get:
 *          tags:
 *             -   Newsletter Subscriptions
 *          description: check if user is subscribed to newsletter
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
