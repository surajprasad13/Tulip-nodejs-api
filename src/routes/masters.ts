import { Router } from "express";
import { body } from "express-validator";
import { fieldsValidate } from "../middlewares/fields-validate";
import { getSymptomMaster } from "../controllers/masters/symptom_master";
import { getPreconditionMaster } from "../controllers/masters/precondition_master";
import { getTreatmentMaster } from "../controllers/masters/treatment_master";
import { getRootCauseMaster } from "../controllers/masters/root_cause_master";
import { getRecipesMaster } from "../controllers/masters/recipes_master";
import { getSymptomConditionMaster } from "../controllers/masters/symptom_condition_master";
import { getAyurvedicMaster } from "../controllers/masters/ayurvedic_master";
import { getNutritionalGuidelinesMaster } from "../controllers/masters/nutritional_guidelines_master";
import { getMedicineArticlesOwn } from "../controllers/masters/medicine_articles_own";
import { getDrinks } from "../controllers/masters/drinks";
import { getMedicationsMaster } from "../controllers/masters/medications_master";
import { getSymptomConditionDoctorInfo } from "../controllers/masters/symptom_condition_doctor_info";
import { getMedicationsInfoLightweight } from "../controllers/masters/medications_info_lightweight";
import { getMedicationsInfo } from "../controllers/masters/medications_info";

const router = Router();

/**
 * @swagger
 * definitions:
 *      FoodId:
 *          type: object
 *          properties:
 *              food_id:
 *                  type: integer
 */

/**
 * @swagger
 * definitions:
 *      SympListM:
 *          type: object
 *          properties:
 *              symptoms:
 *                  type: array
 *                  items:
 *                      type: string
 */

/**
 * @swagger
 * definitions:
 *      MediArtOwnM:
 *          type: object
 *          properties:
 *              symptoms:
 *                  type: array
 *                  items:
 *                      type: string
 *              treatments:
 *                  type: array
 *                  items:
 *                      type: string
 */

/**
 * @swagger
 * /minitulip/master/symptom:
 *      get:
 *          tags:
 *              -   Master Endpoints
 *          description: Get master symptom table
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
router.get("/symptom", getSymptomMaster);

/**
 * @swagger
 * /minitulip/master/precondition:
 *      get:
 *          tags:
 *              -   Master Endpoints
 *          description: Get master precondition table
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
router.get("/precondition", getPreconditionMaster);

/**
 * @swagger
 * /minitulip/master/treatment:
 *      get:
 *          tags:
 *              -   Master Endpoints
 *          description: Get master treatment table
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
router.get("/treatment", getTreatmentMaster);

/**
 * @swagger
 * /minitulip/master/root-causes:
 *      post:
 *          tags:
 *              -   Master Endpoints
 *          description: Get master root causes
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/SympListM'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: There are missing mandatory fields
 *              401:
 *                  description: Invalid Tokens
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
  "/root-causes",
  [
    body("symptoms", "The Symptoms is a mandatory list")
      .isArray()
      .not()
      .isEmpty(),
    body("symptoms.*", "Each symptom must be an integer").isNumeric(),
    fieldsValidate,
  ],
  getRootCauseMaster
);

router.get("/symptom-condition", getSymptomConditionMaster);

/**
 * @swagger
 * /minitulip/master/recipes:
 *      post:
 *          tags:
 *              -   Master Endpoints
 *          description: Get recipes based on food.
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/FoodId'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: There are missing mandatory fields
 *              401:
 *                  description: Invalid Tokens
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
  "/recipes",
  [
    body("food_id", "The food_id is mandatory").not().isEmpty(),
    body("food_id", "The food_id must be an integer").isNumeric(),
    fieldsValidate,
  ],
  getRecipesMaster
);

router.get("/ayurvedic-master", getAyurvedicMaster);

router.get("/nutritional-guidelines-master", getNutritionalGuidelinesMaster);

/**
 * @swagger
 * /minitulip/master/medicine-articles-own:
 *      post:
 *          tags:
 *              -   Master Endpoints
 *          description: Get medicine articles own (hand picked)
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/MediArtOwnM'
 *          responses:
 *              200:
 *                  description: Success
 *              400:
 *                  description: There are missing mandatory fields
 *              401:
 *                  description: Invalid Tokens
 *              500:
 *                  description: Database error
 */
router.post(
  "/medicine-articles-own",
  [
    body("symptoms", "The Symptoms is a mandatory list")
      .isArray()
      .not()
      .isEmpty(),
    body("treatments", "The Treatments is a mandatory list")
      .isArray()
      .not()
      .isEmpty(),
    fieldsValidate,
  ],
  getMedicineArticlesOwn
);

router.get("/drinks", [], getDrinks);

router.get("/medications", [], getMedicationsMaster);

router.get("/symptom-condition-doctor-info", [], getSymptomConditionDoctorInfo);

router.get("/medications-info-lightweight", [], getMedicationsInfoLightweight);

router.get("/medications-info", [], getMedicationsInfo);

export default router;
