import { ingestAskExpertQuestionsAnswers } from './../../controllers/admin/google_data_ingestion/ask_expert_questions_answers';
import { ingestQuestionRemedies } from './../../controllers/admin/google_data_ingestion/question-remedies'
import { ingestRemedyException } from './../../controllers/admin/google_data_ingestion/remedy-exception'
import { ingestRemedyAlternative } from './../../controllers/admin/google_data_ingestion/remedy-alternative'
import { Router } from 'express'
import { ingestDynamicTexts } from '../../controllers/admin/google_data_ingestion/dynamic-texts'
import { ingestEpocrates } from '../../controllers/admin/google_data_ingestion/epocrates'
import { ingestQuestions } from '../../controllers/admin/google_data_ingestion/questions'
import { ingestQuestionGrammar } from '../../controllers/admin/google_data_ingestion/question-grammar'
import { ingestRemedyMaster } from '../../controllers/admin/google_data_ingestion/remedy-master'
import { ingestPresetsMaster } from '../../controllers/admin/google_data_ingestion/presets-master'
import { ingestRootCauseInsights } from '../../controllers/admin/google_data_ingestion/root_cause_insights'
import { ingestAllergyMaster } from '../../controllers/admin/google_data_ingestion/allergy-master'
import { ingestConstitutions } from '../../controllers/admin/google_data_ingestion/constitutions'
import { ingestDashboardReference } from '../../controllers/admin/google_data_ingestion/dashboard-reference'

const router = Router()

/**
 * @swagger
 * /minitulip/admin/data-ingestion/questions:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest questions from Google Sheets to DB
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
router.post('/questions', ingestQuestions)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/dynamic-texts:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest dynamic texts from Google Sheets to DB
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
router.post('/dynamic-texts', ingestDynamicTexts)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/question-grammar:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest question grammar from Google Sheets to DB
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
router.post('/question-grammar', ingestQuestionGrammar)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/epocrates:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest epocrates medications list from Google Sheets to DB
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
router.post('/epocrates', ingestEpocrates)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/remedy-master:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest remedies list from Google Sheets to DB
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
router.post('/remedy-master', ingestRemedyMaster)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/remedy-alternative:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest remedy alternatives from Google Sheets to DB
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
router.post('/remedy-alternative', ingestRemedyAlternative)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/remedy-exception:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest remedy exception from Google Sheets to DB
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
router.post('/remedy-exception', ingestRemedyException)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/question-remedies:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest question remedies from Google Sheets to DB
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
router.post('/question-remedies', ingestQuestionRemedies)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/presets-master:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest presets master from Google Sheets to DB
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
router.post('/presets-master', ingestPresetsMaster)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/root-cause-insights:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest root cause sheet from Tulip Dynamic Content pages
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
router.post('/root-cause-insights', ingestRootCauseInsights)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/allergy-master:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest allergy master sheet
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
router.post('/allergy-master', ingestAllergyMaster)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/constitution:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest constitution sheet
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
router.post('/constitution', ingestConstitutions)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/dashboard-reference:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest dashboard reference sheet
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
router.post('/dashboard-reference', ingestDashboardReference)

/**
 * @swagger
 * /minitulip/admin/data-ingestion/ask-expert-questions-answers:
 *      post:
 *          tags:
 *              -   Data Ingestion Endpoints
 *          description: Ingest ask expert questions answers sheet
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
router.post('/ask-expert-questions-answers', ingestAskExpertQuestionsAnswers)

export default router
