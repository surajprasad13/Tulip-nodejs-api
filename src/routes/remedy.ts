import { Router } from "express"
import { body } from "express-validator"
import { fieldsValidate } from "../middlewares/fields-validate"
import { getAll, getAllGenerate, getRemedies, getStory } from "../controllers/remedy"

const router = Router()

/**
 * @swagger
 * definitions:
 *      Trees:
 *          type: object
 *          properties:
 *              filter:
 *                  type: boolean
 *              group_id:
 *                  type: integer
 */

/**
 * @swagger
 * definitions:
 *      TreesGroup:
 *          type: object
 *          properties:
 *              group_id:
 *                  type: integer
 *              section_id:
 *                  type: integer
 */

/**
 * @swagger
 * /minitulip/remedy:
 *      post:
 *          tags:
 *              -   Remedy Endpoints
 *          description: 101 for Sleep. 102 for Fatigue. 103 for Blood Sugar. 104 for Long Covid. 105 for Free Long Covid
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Trees'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: The group id and filter are mandatory
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: User does not have answers
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
	"/",
	[
		body("group_id", "The Group ID is mandatory").not().isEmpty(),
		body("group_id", "The Group ID must be numeric").isNumeric(),
		body("filter", "The filter is mandatory").not().isEmpty(),
		body("filter", "The filter must be boolean").isBoolean(),
		fieldsValidate,
	],
	getRemedies
)

/**
 * @swagger
 * /minitulip/remedy/story:
 *      post:
 *          tags:
 *              -   Remedy Endpoints
 *          description: Get all recommendations in a story telling format for a user based on his/her answers. id_group 101 for Sleep. 102 for Fatigue. 103 for Blood Sugar. 104 for Long Covid. 105 for Free Long Covid. id_section 1 for Supplements. 2 for Nutrition. 3 for Hydration. 4 for Lifestyle. 5 for Root Causes. 6 for Contraindications. 7 for Deficiencies
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/TreesGroup'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: The group id and filter are mandatory
 *              401:
 *                  description: Invalid Token
 *              404:
 *                  description: User does not have answers
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
	"/story",
	[
		body("group_id", "The Group ID is mandatory").not().isEmpty(),
		body("group_id", "The Group ID must be numeric").isNumeric(),
		body("section_id", "The Section ID is mandatory").not().isEmpty(),
		body("section_id", "The Section ID must be numeric").isNumeric(),
		fieldsValidate,
	],
	getStory
)


/**
 * @swagger
 * /minitulip/remedy/all-generate:
 *      get:
 *          tags:
 *              -   Remedy Endpoints
 *          description: generate Remedy Plan + Insights + Story + Contra + Deficiency
 *          parameters:
 *              -   in: query
 *                  name: planId
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: plan (101, 102, etc)
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

 router.get("/all-generate", getAllGenerate)

/**
 * @swagger
 * /minitulip/remedy/all:
 *      get:
 *          tags:
 *              -   Remedy Endpoints
 *          description: get all Remedy Plan + Insights + Story + Contra + Deficiency that has already been computed
 *          parameters:
 *              -   in: query
 *                  name: planId
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: plan (101, 102, etc)
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

 router.get("/all", getAll)

export default router
