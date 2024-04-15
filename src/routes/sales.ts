import { Router } from "express"

import { getBalance, getSubscription, getUsers, getPayments, getLastPlans } from "../controllers/sales"
import { getPlans } from "../controllers/admin/sales"

import { adminJwtValidate, ROLES } from "../middlewares/admin-jwt-validate"

const router = Router()

router.get("/users", getUsers)

router.get("/subscriptions", getSubscription)

router.get("/balances", getBalance)

router.get("/payments", getPayments)

router.get("/plans", adminJwtValidate([ROLES.ROOT_ADMIN]), getPlans)

/**
 * @swagger
 * /minitulip/sales/lastplans/{id}:
 *      get:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Get all plans that were paid for in the past 32 days
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The user id
 *          responses:
 *              200:
 *                  description: Success
 *              500:
 *                  description: Database error
 */
router.get("/lastplans/:id", getLastPlans)

export default router
