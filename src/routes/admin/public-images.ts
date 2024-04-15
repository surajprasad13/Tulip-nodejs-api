import { Router } from 'express'
import { deletePublicImage, postPublicImage } from '../../controllers/admin/public-images'
import multer from 'multer'
import { query } from 'express-validator'
import { fieldsValidate } from '../../middlewares/fields-validate'

const router = Router()

/**
 * @swagger
 * definitions:
 *      PublicImage:
 *          type: object
 *          properties:
 *              spaceName:
 *                  type: string
 *              file:
 *                  type: string
 *                  format: binary
 */

/**
 * @swagger
 * /minitulip/admin/public-images:
 *      post:
 *          tags:
 *              -   Admin Public Images
 *          description: Upload public images to digital ocean Spaces
 *          requestBody:
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#definitions/PublicImage'
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
  multer({
    limits: {
      fileSize: 25000000, //25MB
    },
  }).single('file'),
  postPublicImage
)

/**
 * @swagger
 * /minitulip/admin/public-images:
 *      delete:
 *          tags:
 *              -   Admin Public Images
 *          description: Delete public images from digital ocean Spaces
 *          parameters:
 *              -   in: query
 *                  name: spaceName
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: Space name
 *              -   in: query
 *                  name: fileName
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: File name
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
router.delete(
  '/',
  [
    query('spaceName', 'Space name is mandatory').not().isEmpty(),
    query('fileName', 'File name is mandatory').not().isEmpty(),
    fieldsValidate,
  ],
  deletePublicImage
)

export default router
