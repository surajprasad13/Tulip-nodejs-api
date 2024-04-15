import { Router } from 'express'
import multer from 'multer'
import { body, query } from 'express-validator'
import { fieldsValidate } from '../../middlewares/fields-validate'
import { deleteBlog, editBlog, postBlog } from '../../controllers/admin/blog'

const router = Router()

/**
 * @swagger
 * definitions:
 *      BlogPost:
 *          type: object
 *          properties:
 *              category:
 *                  type: string
 *              title:
 *                  type: string
 *              description:
 *                  type: string
 *              image:
 *                  type: string
 *              url:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/admin/blog:
 *      post:
 *          tags:
 *              -   Blog Endpoints
 *          description: Creates blog posts
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/BlogPost'
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
  [
    body('category', 'Category is mandatory').not().isEmpty(),
    body('title', 'Title is mandatory').not().isEmpty(),
    body('description', 'Description is mandatory').not().isEmpty(),
    body('image', 'Image is mandatory').not().isEmpty(),
    fieldsValidate,
  ],
  postBlog
)

/**
 * @swagger
 * /minitulip/admin/blog/{id}:
 *      delete:
 *          tags:
 *              -   Blog Endpoints
 *          description: Delete blog posts
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: Blog post id
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
router.delete('/:id', deleteBlog)

/**
 * @swagger
 * /minitulip/admin/blog/{id}:
 *      put:
 *          tags:
 *              -   Blog Endpoints
 *          description: Edit blog posts
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: Blog post id
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/BlogPost'
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
router.put(
  '/:id',
  [
    body('category', 'Category is mandatory').not().isEmpty(),
    body('title', 'Title is mandatory').not().isEmpty(),
    body('description', 'Description is mandatory').not().isEmpty(),
    body('image', 'Image is mandatory').not().isEmpty(),
    fieldsValidate,
  ],
  editBlog
)

export default router
