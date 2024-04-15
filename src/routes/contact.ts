import { Router } from "express"
import { body } from "express-validator"
import { postContact } from "../controllers/contact"
import { fieldsValidate } from "../middlewares/fields-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      Contact:
 *          type: object
 *          properties:
 *              name:
 *                  type: string
 *              email:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/contact:
 *      post:
 *          tags:
 *             -   Contact Endpoints
 *          description: Update users profile image
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Contact'
 *
 *          responses:
 *              200:
 *                  description: Contact uploaded successfully
 *              400:
 *                  description: Not found
 */

router.post(
	"/",
	[
		body("name", "The Name is mandatory").not().isEmpty(),
		body("email", "The email is mandatory").isEmail(),
		fieldsValidate,
	],
	postContact
)

export default router
