import { Router } from "express";
import { body } from "express-validator";
import { fieldsValidate } from "../middlewares/fields-validate";
import { jwtValidate } from "../middlewares/jwt-validate";
import { getCardGPTStreamed, getGPT } from "../controllers/smart-chat/getGPT";
import { getSymptomsAndConditions } from "../controllers/smart-chat/diagnoseAlgorithm/getSymptomsAndConditions";
import { getSymptomConditionsMatches } from "../controllers/smart-chat/diagnoseAlgorithm/getSymptomConditionsMatches";
import { getAyurvedicAndChineseQuestions } from "../controllers/smart-chat/getAyurvedicAndChineseQuestions";

const router = Router();

/**
 * @swagger
 * definitions:
 *      Schat:
 *          type: object
 *          properties:
 *              chat:
 *                  type: array
 *                  items:
 *                      type: object
 *                      properties:
 *                          role:
 *                              type: string
 *                          content:
 *                              type: string
 */

/**
 * @swagger
 * /minitulip/smart-chat:
 *      post:
 *          tags:
 *              -   Smart Chat Endpoints
 *          description: Get response for the smart chat
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Schat'
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
  "/",
  [
    body("chat", "The chat array is mandatory").isArray(),
    body(
      "chat.*.role",
      "Each object in chat array must have a 'role' property"
    ).exists(),
    body(
      "chat.*.content",
      "Each object in chat array must have a 'content' property"
    ).exists(),
    fieldsValidate,
  ],
  getGPT
);

/**
 * @swagger
 * /minitulip/smart-chat/symptoms-and-conditions:
 *      post:
 *          tags:
 *              -   Smart Chat Endpoints
 *          description: Extract symptoms and conditions from the smart chat
 *          requestBody:
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#definitions/Schat'
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
  "/symptoms-and-conditions",
  [
    body("chat", "The chat array is mandatory").isArray(),
    body(
      "chat.*.role",
      "Each object in chat array must have a 'role' property"
    ).exists(),
    body(
      "chat.*.content",
      "Each object in chat array must have a 'content' property"
    ).exists(),
    fieldsValidate,
  ],
  getSymptomsAndConditions
);

router.post("/symptoms-conditions-matches", getSymptomConditionsMatches);

router.get("/ayurvedic-and-chinese-questions", getAyurvedicAndChineseQuestions);

router.post(
  "/card-chat-streamed",
  [
    body("chat", "The chat array is mandatory").isArray(),
    body(
      "chat.*.role",
      "Each object in chat array must have a 'role' property"
    ).exists(),
    body(
      "chat.*.content",
      "Each object in chat array must have a 'content' property"
    ).exists(),
    body("card", "The Card ID is mandatory").not().isEmpty(),
    body("card", "The Card ID must be numeric").isNumeric(),
    fieldsValidate,
  ],
  getCardGPTStreamed
);

export default router;
