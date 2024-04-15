import { Router } from 'express'
import { body, param } from 'express-validator'
import { fieldsValidate } from '../../middlewares/fields-validate'
import { signInAdminUser } from '../../controllers/admin/auth/sign-in-admin-user'
import { signUpAdminUser } from '../../controllers/admin/auth/sign-up-admin-user'
import { adminJwtValidate, ROLES } from '../../middlewares/admin-jwt-validate'
import { listAdminUsers } from '../../controllers/admin/auth/list-admin-users'
import { deleteAdminUser } from '../../controllers/admin/auth/delete-admin-user'
import { updateAdminUserInfo } from '../../controllers/admin/auth/update-admin-user-info'
import multer from 'multer'
import { getDoctorProfileImage } from '../../controllers/admin/auth/profile-image'
import { getAdminUserInfo } from '../../controllers/admin/auth/user-info'

const router = Router()

/**
 * @swagger
 * definitions:
 *      Roles:
 *          type: string
 */

/**
 * @swagger
 * definitions:
 *      NewAdminUser:
 *          type: object
 *          properties:
 *              email:
 *                  type: string
 *              name:
 *                  type: string
 *              password:
 *                  type: string
 *              roles:
 *                  type: array
 *                  items:
 *                      $ref: '#definitions/Roles'
 */

/**
 * @swagger
 * definitions:
 *      AdminUser:
 *          type: object
 *          properties:
 *              email:
 *                  type: string
 *              password:
 *                  type: string
 */

/**
 * @swagger
 * definitions:
 *      AdminUserInfo:
 *          type: object
 *          properties:
 *              designation:
 *                  type: string
 *              profileImage:
 *                  type: string
 *                  format: binary
 */

/**
 * @swagger
 * /minitulip/admin-auth/signUp:
 *      post:
 *          tags:
 *              -   Admin Auth Endpoints
 *          description: Create new admin user
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/NewAdminUser'
 *          responses:
 *              200:
 *                  description: Admin User Created
 *              400:
 *                  description: Email, password, and roles are mandatory
 *              404:
 *                  description: Invalid email, password, or roles
 *          security:
 *          -   access_token: []
 */
router.use('/signUp', adminJwtValidate([ROLES.ROOT_ADMIN]))
router.post(
  '/signUp',
  [
    body('email', 'The email is mandatory').not().isEmpty(),
    body('name', 'The name is mandatory').not().isEmpty(),
    body('roles', 'Roles are mandatory').not().isEmpty(),
    body('roles', 'Roles must be an array').isArray(),
    body('password', 'The password is mandatory and more than 8 caracters').isLength({ min: 8 }),
    body('email', 'Invalid email').isEmail(),
    fieldsValidate,
  ],
  signUpAdminUser
)

/**
 * @swagger
 * /minitulip/admin-auth/delete-user/{id}:
 *      delete:
 *          tags:
 *              -   Admin Auth Endpoints
 *          description: Delete admin user
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The admin user id to be deleted
 *          responses:
 *              200:
 *                  description: Admin User Deleted
 *              401:
 *                  description: Invalid Token
 *              400:
 *                  description: invalid params
 *          security:
 *          -   access_token: []
 */

router.use('/delete-user', adminJwtValidate([ROLES.ROOT_ADMIN]))
router.delete(
  '/delete-user/:id',
  [
    param('id', 'The admin user identifier is mandatory').not().isEmpty(),
    param('id', 'The admin user identifier must be numeric').isNumeric(),
    fieldsValidate,
  ],
  deleteAdminUser
)

/**
 * @swagger
 * /minitulip/admin-auth/list-admin-users:
 *      get:
 *          tags:
 *              -   Admin Auth Endpoints
 *          description: Get all admin users
 *          responses:
 *              200:
 *                  description: Success
 *              401:
 *                  description: Invalid Token
 *          security:
 *          -   access_token: []
 * */

router.use('/list-admin-users', adminJwtValidate([ROLES.ROOT_ADMIN]))
router.get('/list-admin-users', listAdminUsers)

/**
 * @swagger
 * /minitulip/admin-auth/signIn:
 *      post:
 *          tags:
 *              -   Admin Auth Endpoints
 *          description: Get token of existing admin user
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/AdminUser'
 *          responses:
 *              200:
 *                  description: Access Token Created
 *              400:
 *                  description: Email and password are mandatory
 *              404:
 *                  description: Invalid email or password
 */
router.post(
  '/signIn',
  [
    body('email', 'The email is mandatory').not().isEmpty(),
    body('password', 'The password is mandatory and more than 8 caracters').isLength({ min: 8 }),
    body('email', 'Invalid email').isEmail(),
    fieldsValidate,
  ],
  signInAdminUser
)

/**
 * @swagger
 * /minitulip/admin-auth/user-info:
 *      post:
 *          tags:
 *              -   Admin Auth Endpoints
 *          description: Update admin user info (designation, profile image...)
 *          requestBody:
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          $ref: '#definitions/AdminUserInfo'
 *          responses:
 *              200:
 *                  description: Access Token Created
 *              404:
 *                  description: Invalid email or password
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
  '/user-info',
  adminJwtValidate([]),
  multer({
    limits: {
      fileSize: 25000000, //25MB
    },
  }).single('profileImage'),
  updateAdminUserInfo
)
/**
 * @swagger
 * /minitulip/admin-auth/doctors/{doctorId}/profile-image:
 *      get:
 *          tags:
 *              -   Admin Auth Endpoints
 *          description: Get the doctor's profile image
 *          parameters:
 *              -   in: path
 *                  name: doctorId
 *                  schema:
 *                      type: integer
 *                  required: true
 *                  description: The doctor identifier
 *          responses:
 *              200:
 *                  description: Success
 *              500:
 *                  description: Database error
 */

router.get('/doctors/:id/profile-image', getDoctorProfileImage)

router.get('/user-info', getAdminUserInfo)

export default router
