import { Router } from "express"
import { getAllSmartInsights, getSmartInsightLandingPage, getFoodsSupplementsFromArticles, getAllArticles, getSmartRecommendation, getSmartRecommendation2, getSmartRecommendation3, alex, getAngularJsScripts, getAllSymptomsAndTreatments, getSmartRecommendation4, getAllArticlesOwn, getSmartRecommendation5 } from "../controllers/smart-recommendation/smart-insight"
import { jwtValidate } from "../middlewares/jwt-validate"
import { getSmartRecommendation6 } from "../controllers/smart-recommendation/smart-recommendation6"
import { getSmartRecommendation7 } from "../controllers/smart-recommendation7/smart-recommendation7"
import { gptTreatmentSorting } from "../controllers/smart-recommendation7/gpt-treatment-sorting"
import { getSymptomTreatmentsData } from "../controllers/smart-recommendation7/symptom-treatments-data"
import { getTreatment } from "../controllers/symptoms/treatment"
import { getTreatmentsFull } from "../controllers/smart-recommendation7/treatments-full"
import { gptTreatmentDescriptions } from "../controllers/smart-recommendation7/gpt-treatment-descriptions"
import { generateSupplementPlan } from "../controllers/smart-recommendation7/supplement-plan"
import { articleSelection } from "../controllers/smart-recommendation7/article-selection"
import { checkSymptomInputText } from "../controllers/smart-recommendation7/check-symptom-input-text"
import { handleDoctorsConditionRequest } from "../controllers/smart-recommendation7/doctors-condition"

const router = Router()

router.get(
	"/all",	
//	jwtValidate,
	getAllSmartInsights
)

router.get(
	"/symptoms-treatments",	
//	jwtValidate,
	getAllSymptomsAndTreatments	
)

router.get(
	"/all-articles",	
//	jwtValidate,
	getAllArticles	
)

router.get(
	"/all-articles-own",	
//	jwtValidate,
	getAllArticlesOwn	
)

router.post(
	"/smart-recommendation",	
//	jwtValidate,
	getSmartRecommendation	
)

router.post(
	"/smart-recommendation2",	
//	jwtValidate,
	getSmartRecommendation2
)

router.post(
	"/smart-recommendation3",	
//	jwtValidate,
	getSmartRecommendation3
)

router.post(
	"/smart-recommendation4",	
//	jwtValidate,
	getSmartRecommendation4
)

router.post(
	"/smart-recommendation5",	
//	jwtValidate,
	getSmartRecommendation5
)

router.post(
	"/smart-recommendation6",	
//	jwtValidate,
	getSmartRecommendation6
)

router.post(
	"/smart-recommendation7",	
//	jwtValidate,
	getSmartRecommendation7
)

router.get(
	"/treatments-full",	
//	jwtValidate,
getTreatmentsFull
)

router.post(
	"/gpt-treatment-descriptions",	
	//	jwtValidate,
	gptTreatmentDescriptions
)

router.post(
	"/supplement-plan",	
	//	jwtValidate,
	generateSupplementPlan
)

router.post(
	"/article-selection",	
	//	jwtValidate,
	articleSelection
)

router.post(
	"/check-symptom-input-text",	
	//	jwtValidate,
	checkSymptomInputText
)

router.post(
	"/symptom-treatments-data",	
//	jwtValidate,
	getSymptomTreatmentsData
)

router.post(
	"/gpt-treatment-sorting",	
//	jwtValidate,
	gptTreatmentSorting
)

router.post(
	"/alex",	
//	jwtValidate,
	alex
)

router.get(
	"/angular-js-scripts",	
//	jwtValidate,
	getAngularJsScripts
)

/**
 * @swagger
 * /minitulip/smart-insight/foods-supplements-from-articles:
 *      get:
 *          tags:
 *             -   Smart Insight Endpoints
 *          description: Fetch foods and supplements from articles for the selected symptoms 
 *          parameters:
 *              -   in: query
 *                  name: symptoms
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: List of symptoms separated by comma
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: Not found
 *          security:
 *          -   access_token: []
 * components:
 *      securitySchemes:
 *          access_token:
 *              type: http
 *              scheme: bearer
 *              bearerFormat: JWT
 */
router.get(
	"/foods-supplements-from-articles",	
	jwtValidate,
	getFoodsSupplementsFromArticles
)

router.post(
	"/doctors-condition",	
	//	jwtValidate,
	handleDoctorsConditionRequest
)

export default router
