import { Router } from "express"
import { query, body, param } from "express-validator"
import {
	fetchTestimonials,
	postTestimonial,
	deleteTestimonial
} from "../controllers/testimonials"
import { fieldsValidate } from "../middlewares/fields-validate"

const router = Router()

/**
 * @swagger
 * /minitulip/testimonial:
 *      get:
 *          tags:
 *             -   Testimonial Endpoints
 *          description: Get All testimonials from database
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

router.get("/", fetchTestimonials)

/**
 * @swagger
 * /minitulip/testimonial/postTestimonial:
 *      post:
 *          tags:
 *              -   Testimonial Endpoints
 *          description: Testimonials for Tulip
 *          parameters:
 *              -   in: query
 *                  name: name
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The name (or title) to be shown in the testimonial card
 *              -   in: query
 *                  name: description
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The description to be showin the the testimonial card
 *              -   in: query
 *                  name: profession
 *                  schema:
 *                      type: string
 *                  required: false
 *                  description: The profession of the person sharing the testimonial
 *              -   in: query
 *                  name: image_url
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: the URL of the image to be shown in the terminal card
 *              -   in: query
 *                  name: group_id
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  description: The Group ID number
 *          responses:
 *              200:
 *                  description: Testimonial saved
 *              400:
 *                  description: Query Param missing or invalid.
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
	"/postTestimonial",
	[
		query("name", "The field 'name' is mandatory").not().isEmpty(),
		query("description", "The field 'description' is mandatory").not().isEmpty(),
		query("image_url", "The field 'image_url' is mandatory").not().isEmpty(),
		fieldsValidate,
	],
	postTestimonial
)


/**
 * @swagger
 * /minitulip/testimonial/delete:
 *      delete:
 *          tags:
 *              -   Testimonial Endpoints
 *          description: soft delete a testimonial
 *          parameters:
 *              -   in: query
 *                  name: id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: soft deletes a testimonial
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
 router.delete(
	"/delete",
	[
		query("id", "The field 'id' is mandatory").not().isEmpty(),
		fieldsValidate
	],
	deleteTestimonial
)

export default router
