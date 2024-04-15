import { Router } from 'express'
import { deletePublicImage, postPublicImage } from '../../controllers/admin/public-images'
import multer from 'multer'
import { query } from 'express-validator'
import { fieldsValidate } from '../../middlewares/fields-validate'
import { updateSiteDataAssets } from '../../controllers/admin/site-data-assets'

const router = Router()

/**
 * @swagger
 * /minitulip/admin/site-data-assets:
 *      post:
 *          tags:
 *              -   Site Data Assets
 *          description: Update site data assets to digital ocean Spaces
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
router.post('/', updateSiteDataAssets)

export default router
