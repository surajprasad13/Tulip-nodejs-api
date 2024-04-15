import { Router } from "express"
import { body } from "express-validator"
import { addNewsLetter, addWaitList } from "../controllers/mail"
import { fieldsValidate } from "../middlewares/fields-validate"

const router = Router()

/**
 * @swagger
 * definitions:
 *      email:
 *          type: object
 *          properties:
 *              email:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      emailList:
 *          type: object
 *          properties:
 *              name:
 *                  type: string
 *              email:
 *                  type: string
 */

/**
 * @swagger
 * /minitulip/mail:
 *      post:
 *          tags:
 *              -   Mail Endpoints
 *          description: Save email for newsletter
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/email'
 *          responses:
 *              200:
 *                  description: Email saved successfully
 *              400:
 *                  description: Email is mandatory
 *              404:
 *                  description: Invalid email
 */

router.post(
    '/',
    [
        body('email', 'The email is mandatory').not().isEmpty(), 
        body('email', 'Invalid email').isEmail(), 
        fieldsValidate
    ],
    addNewsLetter
)

/**
 * @swagger
 * /minitulip/mail/waitlist:
 *      post:
 *          tags:
 *              -   Mail Endpoints
 *          description: Save email for wait list
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/emailList'
 *          responses:
 *              200:
 *                  description: Email saved successfully
 *              400:
 *                  description: Email is mandatory. Name is mandatory
 *              404:
 *                  description: Invalid email
 */

router.post(
    '/waitlist',
    [
        body('name', 'The name is mandatory').not().isEmpty(), 
        body('email', 'The email is mandatory').not().isEmpty(), 
        body('email', 'Invalid email').isEmail(), 
        fieldsValidate
    ],
    addWaitList
)

export default router