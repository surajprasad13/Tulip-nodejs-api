import express, { Router } from "express"
import { body } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { stripe } from "../services/stripe"

import {
	createPayment,
	getPlans,
	paymentSuccess,
	paymentFail,
	getCheckoutSession,
	getCouponCodeDetail,
	subscription,
	getPriceDetail,
	createPortalSession,
	createCustomer,
	fetchUserBilling,
} from "../controllers/stripe"

const router = Router()

const endpointSecret = "whsec_228c4fc1423e60332ae3ed913b192ac2198cde4007662196f30d1b78067df8ca"

router.post("/createCustomer", createCustomer)

/**
 * @swagger
 * definitions:
 *      Token:
 *          type: object
 *          properties:
 *              token:
 *                  type: string
 *                  format: uuid
 *                  description: Stripe Token ID
 *      SubId:
 *           type: object
 *           properties:
 *              subscriptionId:
 *                  type: string
 *                  format: string
 *                  description: Stripe Token ID
 *      Price:
 *          type: object
 *          properties:
 *              items:
 *                  type: object
 *                  description: product price id
 *              coupon:
 *                  type: string
 *                  description: coupon id
 *              stripeUserId:
 *                type: string
 *                description: customer stripe user id
 *
 */

/**
 * @swagger
 * definitions:
 *      SubUpdate:
 *          type: object
 *          properties:
 *              stripeId:
 *                  type: string
 *              itemId:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/stripe/getPlans:
 *      get:
 *          tags:
 *              -   Stripe Endpoints
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

router.get("/getPlans", getPlans)

/**
 * @swagger
 * /minitulip/stripe/create-payment:
 *      post:
 *          tags:
 *              -   Stripe Endpoints
 *          description: Get plans from database
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Price'
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

router.post("/create-payment", createPayment)

/**
 * @swagger
 * /minitulip/stripe/checkout-session:
 *      post:
 *          tags:
 *              -   Stripe Endpoints
 *          description: Get Payment Details
 *          parameters:
 *              -   in: query
 *                  name: session_id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The ID of on success payment
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

router.post("/checkout-session", getCheckoutSession)

/**
 * @swagger
 * /minitulip/stripe/create-portal-session:
 *      post:
 *          tags:
 *              -   Stripe Endpoints
 *          description: Get Payment Details
 *          parameters:
 *              -   in: query
 *                  name: session_id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The ID of on success payment
 *          responses:
 *              200:
 *                  description: Redirect to homepage of subcription page
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

router.post("/create-portal-session", createPortalSession)

/**
 * @swagger
 * /minitulip/stripe/payment-success:
 *      post:
 *          tags:
 *              -   Stripe Endpoints
 *          description: On payment success
 *          parameters:
 *              -   in: query
 *                  name: session_id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The ID of on success payment
 *              -   in: query
 *                  name: product_id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The product id of the get plans
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

router.post("/payment-success", paymentSuccess)

/**
 * @swagger
 * /minitulip/stripe/payment-fail:
 *      post:
 *          tags:
 *              -   Stripe Endpoints
 *          description: Get plans from database
 *          parameters:
 *              -   in: query
 *                  name: session_id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The ID of on create payment
 *              -   in: query
 *                  name: product_id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The product id of the get plans
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

router.post("/payment-fail", paymentFail)

/**
 * @swagger
 * /minitulip/stripe/getCoupon/{id}:
 *      get:
 *          tags:
 *              -   Stripe Endpoints
 *          description: Get coupon detail from stripe
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: string
 *                  description: The coupon ID
 *                  required: true
 *          responses:
 *              200:
 *                  description: Get coupon information successfully
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

router.get("/getCoupon/:id", getCouponCodeDetail)

/**
 * @swagger
 * definitions:
 *      Amount:
 *          type: object
 *          properties:
 *              amount:
 *                  type: number
 *                  format: float
 *      StripeUserId:
 *          type: object
 *          properties:
 *              stipeUserId:
 *                  type: string
 *                  format: string
 */

/**
 * @swagger
 * /minitulip/stripe/price/{id}:
 *      get:
 *          tags:
 *              -   Stripe Endpoints
 *          description: Get Price detail from stripe
 *
 *          responses:
 *              200:
 *                  description: Price information returned successfully
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

router.get("/price/:id", getPriceDetail)

/**
 * @swagger
 * /minitulip/stripe/subscription:
 *      get:
 *          tags:
 *              -   Stripe Endpoints
 *          description: Get Price detail from stripe
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/StripeUserId'
 *
 *          responses:
 *              200:
 *                  description: Subscription information returned successfully
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

router.get(
	"/subscription",
	[body("stripeUserId", "Stripe id is required").not().isEmpty(), fieldsValidate],
	subscription.getSubscription
)

/**
 * @swagger
 * /minitulip/stripe/subscription:
 *      put:
 *          tags:
 *             -   Stripe Endpoints
 *          description: Update subscription model
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/SubUpdate'
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

router.put(
	"/subscription",
	[body("stripeUserId", "Stripe id is required").not().isEmpty(), fieldsValidate],
	subscription.updateSubscription
)

/**
 * @swagger
 * /minitulip/stripe/subscription:
 *      delete:
 *          tags:
 *              -   Stripe Endpoints
 *          description: Get Price detail from stripe
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/SubId'
 *
 *          responses:
 *              200:
 *                  description: Subscription information returned successfully
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

router.get(
	"/billing",
	[body("stripeUserId", "stripeUserId is required").not().isEmpty(), fieldsValidate],
	fetchUserBilling
)

router.delete(
	"/subscription",
	[body("subscriptionId", "Subscription id is required").not().isEmpty(), fieldsValidate],
	subscription.cancelSubscription
)

export default router
