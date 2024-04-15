import { Router } from 'express'
import { body, query } from 'express-validator'
import { loginUser, createUser, resetSend, resetPassword, socialLogin, verifyEmail, otpAuth, getUserType, userProfile, verifyOTP } from '../controllers/auth'
import { fieldsValidate } from '../middlewares/fields-validate'
import { jwtValidate } from '../middlewares/jwt-validate'

const router = Router()

/**
 * @swagger
 * definitions:
 *      UserProfile:
 *          type: object
 *          properties:
 *              name:
 *                  type: string
 *              phoneNumber:
 *                  type: string
 *              country:
 *                  type: string
 *              gender:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      User:
 *          type: object
 *          properties:
 *              email:
 *                  type: string
 *              password:
 *                  type: string
 *      Uuid:
 *          type: object
 *          properties:
 *               uuid:
 *                  type: string
 *
 *      Email:
 *          type: object
 *          properties:
 *               email:
 *                  type: string
 *
 */

/**
 * @swagger
 * definitions:
 *      Usertoken:
 *          type: object
 *          properties:
 *              email:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      VerifyEmail:
 *          type: object
 *          properties:
 *              email:
 *                  type: string
 *              otp:
 *               type: string
 */

/**
 * @swagger
 * definitions:
 *   ResetPassword:
 *         type: object
 *         properties:
 *              email:
 *                  type: string
 *              password:
 *                  type: string
 *              otp:
 *                 type: string
 *
 */

/**
 * @swagger
 * definitions:
 *      Userotp:
 *          type: object
 *          properties:
 *              email:
 *                  type: string
 *              password:
 *                  type: string
 *              otp:
 *                  type: int
 */

/**
 * @swagger
 * definitions:
 *   OTP:
 *         type: object
 *         properties:
 *              email:
 *                  type: string
 *              name:
 *                  type: string
 *              otp:
 *                 type: string
 *
 */

/**
 * @swagger
 * definitions:
 *   verifyOTP:
 *         type: object
 *         properties:
 *              email:
 *                  type: string
 *              otp:
 *                 type: string
 *
 */

/**
 * @swagger
 * /minitulip/auth/userLogin:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Get token of existing user
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/User'
 *          responses:
 *              200:
 *                  description: Access Token Created
 *              400:
 *                  description: Email and password are mandatory
 *              404:
 *                  description: Invalid email or password
 */
router.post(
  '/userLogin',
  [
    body('email', 'The email is mandatory').not().isEmpty(),
    body('password', 'The password is mandatory and more than 8 caracters').isLength({ min: 8 }),
    body('email', 'Invalid email').isEmail(),
    fieldsValidate,
  ],
  loginUser
)
/**
 * @swagger
 * /minitulip/auth/socialLogin:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Get token of socail providers
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                         $ref: '#definitions/Email'
 *          responses:
 *              200:
 *                  description: Access Token Created
 *              400:
 *                  description: Uuid are mandatory
 *              404:
 *                  description: Not found
 */

router.post('/socialLogin', [body('Token', 'Token is mandatory').not().isEmpty()], socialLogin)

/**
 * @swagger
 * /minitulip/auth/userRegister:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Create new user and generate token
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/User'
 *          responses:
 *              200:
 *                  description: User and Access Token Created
 *              400:
 *                  description: Email and password are mandatory
 *              404:
 *                  description: Invalid email or password
 */
router.post(
  '/userRegister',
  [
    body('email', 'The email is mandatory').not().isEmpty(),
    body('password', 'The password is mandatory and more than 8 caracters').isLength({ min: 8 }),
    body('email', 'Invalid email').isEmail(),
    body('isLabUser', 'Lab user not specified.').not().isEmpty(),
    fieldsValidate,
  ],
  createUser
)

/**
 * @swagger
 * /minitulip/auth/verifyEmail:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Sends OTP Code to Reset Password
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/VerifyEmail'
 *          responses:
 *              200:
 *                  description: OTP Code Sent
 *              400:
 *                  description: Email and recaptcha token are mandatory
 *              404:
 *                  description: Invalid email or unsuccessful recaptcha verify request
 */

router.post(
  '/verifyEmail',
  [body('email', 'The email is mandatory').not().isEmpty(), body('email', 'Invalid email').isEmail(), fieldsValidate],
  verifyEmail
)

/**
 * @swagger
 * /minitulip/auth/sendMailOtp:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Sends OTP Code to Reset Password
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Usertoken'
 *          responses:
 *              200:
 *                  description: OTP Code Sent
 *              400:
 *                  description: Email and recaptcha token are mandatory
 *              404:
 *                  description: Invalid email or unsuccessful recaptcha verify request
 */
router.post(
  '/sendMailOtp',
  [body('email', 'The email is mandatory').not().isEmpty(), body('email', 'Invalid email').isEmail(), fieldsValidate],
  resetSend
)

/**
 * @swagger
 * /minitulip/auth/resetPassword:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Reset User's Password
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/ResetPassword'
 *          responses:
 *              200:
 *                  description: OTP Code Sent
 *              400:
 *                  description: Email and recaptcha token are mandatory
 *              404:
 *                  description: Invalid email or unsuccessful recaptcha verify request
 */
router.post(
  '/resetPassword',
  [
    body('email', 'The email is mandatory').not().isEmpty(),
    body('password', 'The password is mandatory and more than 8 caracters').isLength({ min: 6 }),
    body('otp', 'The OTP is mandatory and 8 digits').isLength({ min: 4, max: 6 }),
    body('email', 'Invalid email').isEmail(),
    fieldsValidate,
  ],
  resetPassword
)

router.post(
  '/resetPassword',
  [
    body('email', 'The email is mandatory').not().isEmpty(),
    body('password', 'The password is mandatory and more than 8 caracters').isLength({ min: 6 }),
    body('otp', 'The OTP is mandatory and 8 digits').isLength({ min: 4, max: 6 }),
    body('email', 'Invalid email').isEmail(),
    fieldsValidate,
  ],
  resetPassword
)


/**
 * @swagger
 * /minitulip/auth/otp:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Sign-up or sign-in with OTP
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/OTP'
 *          responses:
 *              200:
 *                  description: User and Access Token Created or OTP sent
 *              400:
 *                  description: Email is mandatory
 *              404:
 *                  description: Invalid email or otp
 */

router.post(
  '/otp',
  [body('email', 'The email is mandatory').not().isEmpty(), fieldsValidate],
  otpAuth
)


/**
 * @swagger
 * /minitulip/auth/userType:
 *      get:
 *          tags:
 *              -   Auth Endpoints
 *          description: Get the user type from the email (if it exists on the DB)
 *          parameters:
 *              -   in: query
 *                  name: email
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: User email
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: Email is mandatory
 */
router.get(
  '/userType',
  [query('email', 'The email is mandatory').not().isEmpty(), fieldsValidate],
  getUserType
)

/**
 * @swagger
 * /minitulip/auth/userProfile:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Update user profile
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/UserProfile'
 *          responses:
 *              200:
 *                  description: User profile updated
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
router.post('/userProfile', jwtValidate, userProfile)

/**
 * @swagger
 * /minitulip/auth/resetPassword:
 *      post:
 *          tags:
 *              -   Auth Endpoints
 *          description: Reset User's Password
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/ResetPassword'
 *          responses:
 *              200:
 *                  description: OTP Code Sent
 *              400:
 *                  description: Email and recaptcha token are mandatory
 *              404:
 *                  description: Invalid email or unsuccessful recaptcha verify request
 */
router.post(
  '/verifyOTP',
  [
    body('email', 'The email is mandatory').not().isEmpty(),
    body('otp', 'The OTP is mandatory and 6 digits').isLength({ min: 4, max: 6 }),
    body('email', 'Invalid email').isEmail(),
    fieldsValidate,
  ],
  verifyOTP
)

export default router