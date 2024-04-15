import { Router } from 'express'
import { adminJwtValidate, ROLES } from '../../middlewares/admin-jwt-validate'
import { body } from 'express-validator'
import { fieldsValidate } from '../../middlewares/fields-validate'
import { createNewsletterTemplate, updateNewsletter } from '../../controllers/admin/newsletter'

/**
 * @swagger
 * definitions:
 *      NewsLetter:
 *          type: object
 *          properties:
 *              title:
 *                  type: string
 *              subject:
 *                  type: string
 *              html:
 *                  type: string
 */

const router = Router()

/**
 * @swagger
 * /minitulip/admin/newsletter:
 *      post:
 *          tags:
 *              -   Admin Newsletter Endpoints
 *          description: Creates a newsletter template
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/NewsLetter'
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
    adminJwtValidate([ROLES.ROOT_ADMIN]),
    [
      body('title', 'Title is mandatory').not().isEmpty(),
      body('title', 'Title must be a string').isString(),
      body('subject', 'Subject is mandatory').not().isEmpty(),
      body('subject', 'Subject must be a string').isString(),
      body('html', 'Html is mandatory').not().isEmpty(),
      body('html', 'Html must be a string').isString(),
      fieldsValidate,
    ],
    createNewsletterTemplate
)

/**
 * @swagger
 * /minitulip/admin/newsletter/update:
 *      post:
 *          tags:
 *              -   Admin Newsletter Endpoints
 *          description: Creates a newsletter status from NEW to TO_SEND
 *          responses:
 *              200:
 *                  description: Success. N rows updated
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
router.put(
  '/update',
  adminJwtValidate([ROLES.ROOT_ADMIN]),
  [
    body('id_template', 'ID is mandatory').not().isEmpty(),
    body('id_template', 'ID must be a number').isNumeric(),
    fieldsValidate,
  ],
  updateNewsletter
)

export default router