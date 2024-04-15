import { Router } from "express"
import { body } from 'express-validator'
import { fetchResearch, setResearch } from "../controllers/research"
import { fieldsValidate } from '../middlewares/fields-validate'

const router = Router()

/**
 * @swagger
 * definitions:
 *      ResearchSubs:
 *          type: object
 *          properties:
 *              first_name:
 *                  type: string
 *              last_name:
 *                  type: string
 *              email:
 *                  type: string
 *              details:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/research:
 *      get:
 *          tags:
 *             -   Research Endpoints
 *          description: Get all research from database
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

router.get("/", fetchResearch)

/**
 * @swagger
 * /minitulip/research:
 *      post:
 *          tags:
 *             -   Research Endpoints
 *          description: Save research subscriber in database
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/ResearchSubs'
 *          responses:
 *              200:
 *                  description: Information saved successfully
 *              500:
 *                  internal error
 */
router.post(
    '/',
    [
        body('email', 'The email is mandatory').not().isEmpty(), 
        body('email', 'Invalid email').isEmail(), 
        body('first_name', 'The first_name is mandatory').not().isEmpty(),
        body('last_name', 'The last_name is mandatory').not().isEmpty(),
        body('details', 'The details field is mandatory').not().isEmpty(),
        fieldsValidate
    ],
    setResearch
  )

export default router
