import { Router } from 'express'
import multer from 'multer'
import { body, query } from 'express-validator'
import { fieldsValidate } from '../../middlewares/fields-validate'
import {
  createSurveyConfiguration,
  deleteSurveyConfiguration,
  getAllSurveyConfigurations,
  getSurveyConfiguration,
  playground,
  updateSurveyConfiguration,
} from '../../controllers/admin/survey-configuration'
import { adminJwtValidate, ROLES } from '../../middlewares/admin-jwt-validate'

const router = Router()

router.post('/playground', adminJwtValidate([ROLES.ROOT_ADMIN]), playground)

/**
 * @swagger
 * definitions:
 *      SurveyConfiguration:
 *          type: object
 *          properties:
 *              groupId:
 *                  type: integer
 *              itemType:
 *                  type: string
 *              questionId:
 *                  type: integer
 *              sentiment:
 *                  type: string
 *              template:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/survey-configuration:
 *      post:
 *          tags:
 *              -   Survey Configuration Endpoints
 *          description: Creates a new survey configuration
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/SurveyConfiguration'
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
    body('groupId', 'GroupId is mandatory').not().isEmpty(),
    body('groupId', 'GroupId must be a number').isNumeric(),
    body('itemType', 'ItemType is mandatory').not().isEmpty(),
    body('itemType', 'ItemType must be a string').isString(),
    body('questionId', 'QuestionId is mandatory').not().isEmpty(),
    body('questionId', 'QuestionId must be a number').isNumeric(),
    body('sentiment', 'Sentiment is mandatory').not().isEmpty(),
    body('sentiment', 'Sentiment must be a string').isString(),
    body('template', 'Template is mandatory').not().isEmpty(),
    body('template', 'Template must be a string').isString(),
    fieldsValidate,
  ],
  createSurveyConfiguration
)

/**
 * @swagger
 * /minitulip/survey-configuration/{id}:
 *      delete:
 *          tags:
 *              -   Survey Configuration Endpoints
 *          description: Delete survey configuration by id
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: Survey Configuration Id
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
router.delete('/:id', adminJwtValidate([ROLES.ROOT_ADMIN]), deleteSurveyConfiguration)

router.put('/:id', adminJwtValidate([ROLES.ROOT_ADMIN]), updateSurveyConfiguration)
router.get('/:id', adminJwtValidate([ROLES.ROOT_ADMIN]), getSurveyConfiguration)

/**
 * @swagger
 * /minitulip/survey-configuration:
 *      get:
 *          tags:
 *              -   Survey Configuration Endpoints
 *          description: Get all survey configurations
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: Leads not found
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */

router.use('/', adminJwtValidate([ROLES.ROOT_ADMIN]), getAllSurveyConfigurations)

export default router
