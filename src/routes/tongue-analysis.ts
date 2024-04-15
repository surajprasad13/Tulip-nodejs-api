import { Router } from "express"
import { query, body, param } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { upload } from "../utils"
import {
	getTongueReport,
	getTongueReport2,
	postUserImage,
	predictTongue
} from "../controllers/tongue-analysis"
import {jwtValidate as jwtValidateTemporary} from "../middlewares/jwt-validate-temp-session"
import { jwtValidate } from "../middlewares/jwt-validate"

const router = Router()


/**
 * @swagger
 * /minitulip/tongue-analysis/image:
 *      post:
 *          tags:
 *             -   Tongue Analysis
 *          description: post image of tongue
 *          parameters:
 *              -   in: query
 *                  name: image_type
 *                  schema:
 *                      type: integer
 *                  required: false
 *                  description: the type of tongue image to be retrieved
 *          requestBody:
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#definitions/Avatar'
 *
 *          responses:
 *              200:
 *                  description: image succesfully uploaded
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

router.post("/image",
	[
		query("image_type", "The field 'image_type' is mandatory").not().isEmpty(),
		fieldsValidate,
	],
	jwtValidateTemporary, 
	upload.single("originalname"), 
	postUserImage)

	
/**
 * @swagger
 * /minitulip/tongue-analysis/analysis:
 *      get:
 *          tags:
 *             -   Tongue Analysis
 *          description: get analysis from stored images
 *          parameters:
 *              -   in: query
 *                  name: image_type
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: the type of tongue image to be retrieved
 *          responses:
 *              200:
 *                  description: image found and URL returned
 *              400:
 *                  description: access error
 *              401:
 *                  description: Invalid Token
 *              500:
 *                  description: error
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */

router.get("/analysis", 
	jwtValidateTemporary, 
	predictTongue)

/**
 * @swagger
 * /minitulip/tongue-analysis/report:
 *      get:
 *          tags:
 *             -   Tongue Analysis
 *          description: get report
 *          responses:
 *              200:
 *                  description: image found and URL returned
 *              400:
 *                  description: access error
 *              401:
 *                  description: Invalid Token
 *              500:
 *                  description: error
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */

router.get("/report", 
	jwtValidateTemporary, 
	getTongueReport)

	/**
 * @swagger
 * /minitulip/tongue-analysis/report2:
 *      get:
 *          tags:
 *             -   Tongue Analysis
 *          description: get report2
 *          responses:
 *              200:
 *                  description: image found and URL returned
 *              400:
 *                  description: access error
 *              401:
 *                  description: Invalid Token
 *              500:
 *                  description: error
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */

router.get("/report2", 
jwtValidate,
getTongueReport2)

export default router
