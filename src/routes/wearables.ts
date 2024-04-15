import { Router } from 'express'
import { body, query } from 'express-validator'
import {
  getWearablesProviders,
  postCode,
  getStatus,
  updateData,
  getData,
  deleteWearable,
  postWearableAnalysis,
  getWearableAnalysis,
  insertWearableDataAppleWatch,
  postAppleHealthData,
  getWearableAnalysis2
} from '../controllers/wearables'
import { adminJwtValidate, ROLES } from '../middlewares/admin-jwt-validate'
import { fieldsValidate } from '../middlewares/fields-validate'
import { jwtValidate } from '../middlewares/jwt-validate'
import { upload } from '../utils'

const router = Router()

/**
 * @swagger
 * definitions:
 *      WearableCode:
 *          type: object
 *          properties:
 *              code:
 *                  type: string
 *              wearableId:
 *                  type: number
 */

/**
 * @swagger
 * definitions:
 *      WearableData:
 *          type: object
 *          properties:
 *              data:
 *                  type: string
 */

/**
* @swagger
*      filecontent:
*         type: file
*/

/**
 * @swagger
 * /minitulip/wearables:
 *      get:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Get auth url for all wearables providers
 *          responses:
 *              200:
 *                  description: Success
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
router.get('/', jwtValidate, getWearablesProviders)

/**
 * @swagger
 * /minitulip/wearables/code:
 *      post:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Submit code for wearable got after user allowance
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/WearableCode'
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
  '/code',
  [
    body('wearableId', 'The wearableId is mandatory').not().isEmpty(),
    body('wearableId', 'The wearableId must be numeric').isNumeric(),
    body('code', 'The code is mandatory').not().isEmpty(),
    fieldsValidate,
  ],
  jwtValidate,
  postCode
)

/**
 * @swagger
 * /minitulip/wearables/status:
 *      get:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Get wearable status for the logged in user
 *          responses:
 *              200:
 *                  description: Success
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
router.get('/status', jwtValidate, getStatus)

router.post('/data', adminJwtValidate([ROLES.ROOT_ADMIN]), updateData)

/**
 * @swagger
 * /minitulip/wearables/data:
 *      get:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Get wearable data from all users. Admin user auth token required
 *          responses:
 *              200:
 *                  description: Success
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

router.get('/data', adminJwtValidate([ROLES.ROOT_ADMIN]), getData)

/**
 * @swagger
 * /minitulip/wearables/{id}:
 *      delete:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Delete wearable from the logged in user
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The wearable id
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

router.delete('/:id', jwtValidate, deleteWearable)

/**
 * @swagger
 * /minitulip/wearables/createWearableAnalysis:
 *      post:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Submit wearable data results
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/WearableData'
 *          responses:
 *              200:
 *                  description: Success
 *              500:
 *                  description: Database error
 */
 router.post(
  '/createWearableAnalysis', 
  [
    body("data", "The data string is mandatory").not().isEmpty(),
		body("data", "The data string must be in JSON format").isJSON(),
    fieldsValidate,
  ],
  postWearableAnalysis
)

/**
 * @swagger
 * /minitulip/wearables/getWearableAnalysis/{id}:
 *      get:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Get wearable data results
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
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */
router.get(
  '/getWearableAnalysis/:id',
  jwtValidate,
  getWearableAnalysis
)

/**
 * @swagger
 * definitions:
 *      WearableData2:
 *          type: object
 *          properties:
 *              start:
 *                  type: string
 *              end:
 *                  type: string
 *              date_request_start:
 *                  type: string
 *              date_request_end:
 *                  type: string
 *              raw_data:
 *                  type: string
 *              wearable_id:
 *                  type: number
 */

/**
 * @swagger
 * /minitulip/wearables/insertWearableDataAppleWatch:
 *      post:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Submit wearable data results for Apple Watch. To be replaced with a generic one.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/WearableData2'
 *          parameters:
 *              -   in: query
 *                  name: limit
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  description: Limit for fetching data default is 10
 *          responses:
 *              200:
 *                  description: Success
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
 router.post(
  '/apple-watch-data', 
  [
		query("wearable_id", "The field 'wearable_id' is mandatory").not().isEmpty(),
    fieldsValidate,
  ],
  upload.single("filecontent"), 
  jwtValidate,
  postAppleHealthData
)


/**
 * @swagger
 * /minitulip/wearables/getWearableAnalysis2:
 *      get:
 *          tags:
 *              -   Wearables Endpoints
 *          description: Get wearable data results 2
 *          responses:
 *              200:
 *                  description: Success
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
router.get(
  '/getWearableAnalysis2',
  jwtValidate,
  getWearableAnalysis2
)

export default router
