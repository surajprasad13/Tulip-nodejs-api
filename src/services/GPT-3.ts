const OpenAI = require("openai");
import SurveyConfigurationModel from "../models/survey_configuration";
import { QuestionsModel, UserAnswerModel, UserProfileModel } from "../models";
import config from "../config";

const openaiApiKey = config.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: openaiApiKey });

export async function getSmartInteractionSentence(
  userName: string,
  groupId: number,
  key: string,
  answersArray: Array<any>
) {
  const surveyConfiguration = await SurveyConfigurationModel.findOne({
    raw: true,
    where: { group_id: groupId, key },
  });

  if (!surveyConfiguration) {
    throw new Error("No survey configuration found");
  }

  const questions = (
    (await QuestionsModel.findAll({
      raw: true,
      where: { group_id: groupId },
    })) || []
  ).reduce((acc: any, question: any) => {
    acc[question.id_question] = question;
    return acc;
  }, {});

  const answers = answersArray.reduce((acc: any, answer: any) => {
    acc[answer.question_id] = answer.values;
    return acc;
  }, {});

  let template = surveyConfiguration.template;

  (template.match(/\[A\d+?\]+/g) || []).forEach((answerPlaceholder: string) => {
    const questionId = +(answerPlaceholder.match(/\d+/g) ?? "0");

    let answer = answers[questionId];

    const question = questions[questionId];

    if (question && answer) {
      if (question.type === "CHECK") {
        const answersValues: Array<String> = [];

        (question.options?.choices ?? []).forEach((c: any) => {
          if (answer.includes(c.value)) {
            answer = answer.replace(c.value, "");
            answersValues.push("'" + c.name + "'");
          }
        });

        answer = answers.join(", ");
      }

      if (question.type === "SELECT") {
        answer = (question.options?.choices ?? []).find(
          (c: any) => c.value === answer
        )?.name;
      }

      template = template.replace(
        new RegExp(`\\[A${questionId}\\]`, "g"),
        answer
      );
    }
  });
  (template.match(/\[Q\d+?\]+/g) || []).forEach(
    (questionPlaceholder: string) => {
      const questionId = +(questionPlaceholder.match(/\d+/g) ?? "0");

      const question = questions[questionId];

      if (question?.question) {
        template = template.replace(
          new RegExp(`\\[Q${questionId}\\]`, "g"),
          question.question
        );
      }
    }
  );

  template = template.replace(/\[sentiment\]/g, surveyConfiguration.sentiment);

  const sentence = (await createCompletion(template))?.choices?.[0]?.text;

  if (!surveyConfiguration.GPT3_responses) {
    surveyConfiguration.GPT3_responses = [];
  }

  surveyConfiguration.GPT3_responses.push({
    sentenceSubmitted: template,
    sentenceReceived: sentence,
    time: new Date(),
  });

  await SurveyConfigurationModel.update(
    { GPT3_responses: surveyConfiguration.GPT3_responses },
    {
      where: { id: surveyConfiguration.id },
    }
  );

  return sentence?.replace(/\[user\_name\]/g, userName);
}

export async function createCompletion(
  text: string,
  config?:
    | null
    | undefined
    | {
        model: string | null | undefined;
        temperature: number | null | undefined;
        max_tokens: number | null | undefined;
        top_p: number | null | undefined;
        frequency_penalty: number | null | undefined;
        presence_penalty: number | null | undefined;
      }
) {
  const requestData = {
    model: config?.model || "gpt-4-1106-preview",
    prompt: text,
    temperature: config?.temperature || 0.7,
    max_tokens: config?.max_tokens || 256,
    top_p: config?.top_p || 1,
    frequency_penalty: config?.frequency_penalty || 0,
    presence_penalty: config?.presence_penalty || 0,
  };

  try {
    const response = await openai.chat.completions.create(requestData);

    return response ?? null;
  } catch (err: any) {
    throw new Error(err?.response?.error?.message);
  }
}
