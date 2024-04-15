const OpenAI = require("openai");
import config from "../../config";
import SmartChat from "../../models/smart_chat";
import { APIfunctions } from "./APIFunctions";
import { arrayFunctions } from "./ArrayFunctions";

interface FunctionCall {
  name: string;
  arguments: string;
}

// Configure OpenAI API
const openaiApiKey = config.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: openaiApiKey });

export const getResponse = async (
  chatArray: any[],
  isAyurveda: boolean = false
) => {
  let isStaticFalseCount = chatArray.filter(
    (item) => item.isStatic === false
  ).length;

  let newData = chatArray.map((item) => {
    let newItem = { ...item };
    delete newItem.isStatic;
    return newItem;
  });

  if (isStaticFalseCount > 1) {
    const lastMessage = newData[newData.length - 1].content;
    let prompt;
    if (isStaticFalseCount % 10 == 0 || isStaticFalseCount % 11 == 0) {
      prompt =
        lastMessage +
        `\n\nProvide proof with useful information or statistics that you truly understand me along the entire chat so far before continuing the chat.`;
      newData[newData.length - 1].content = prompt;
    }
    // else {
    //   prompt = lastMessage + `\n\nProvide a short, one-paragraph response if appropriate. However, if the response is lengthy or addresses multiple contexts, please divide it into two or more paragraphs.`
    // }
    // newData[newData.length - 1].content = prompt
  }

  newData.unshift({
    content:
      "Hello and welcome to Tulip! We are here to help identify which natural remedies could help you feel better.\n\nCould you please describe your main symptom",
    role: "assistant",
    isStatic: false,
  });

  try {
    let ayurvedaQuestions = { all: "", stress: "" };
    if (isAyurveda) {
      ayurvedaQuestions.all = `Ayurvedic Medicine: 
Say exactly this to the user and then start asking questions: "Ayurvedic medicine, an ancient Indian holistic practice, tailors treatments and wellness strategies to an individual's unique balance of the three doshas: Vata, Pitta, and Kapha. The next set of questions will help us determine your Ayurvedic dosha, or constitution, to give you a more personalized treatment plan."
Would you say your metabolism is fast, average with no issues gaining or losing weight, or slow?
Wait for their response
How would you describe your hair? For example, dry, graying, thinning, thick, or oily?
Wait for their response
What climate do you feel the best in?
Wait for their response
How would you describe your typical bowel movements?`;
      ayurvedaQuestions.stress = `How do you usually feel when you are under stress? For example, anxious, irritable, or depressed?`;
    }
    let messages = [
      {
        role: "system",
        content: `Introduction: 
Greet the user warmly and introduce yourself by saying Hello and welcome to Tulip! We are here to help identify which natural remedies could help you feel better. Be short and to the point
Separate message to ask the questions
Ask them to describe their main symptoms or concern
Wait for their response and USE the function checkMainSymptomTooGeneric

Gender and Age: One question at a time:
Politely ask for their biological gender
Wait for their response
Ask for their age, one at a time, as this information is crucial for understanding certain symptoms.

Understanding their issue:
Now ask the user "Please describe your main symptom or condition briefly."Ask the user to describe their main symptom or condition. If there are multiple symptoms, request them to specify their primary concern.
Always ask one question at a time, waiting for the user to answer the question before asking another question.
Be short, direct, to the point.

Narrowing Down: One question at a time:
Continue with more specific questions related to the user's main symptom, asking only one question at a time and waiting for the user's response before proceeding to the next question.
If the symptom or condition is too generic, ask more questions to understand it better. One question at a time and ask the next question only after the user responds to the existing question
Ask where it makes sense based on their issue if they have any symptoms that happen at or around the same time as your [main issue]?
Inquire about the duration since the symptom started, if it makes sense ask about how severe the symptom is on a scale of 1 to 5,  and only for symptoms where it will really help to give better recommendations ask about its impact on their daily life. One question at a time, be short and to the point
Ask about other specific symptoms that can help us narrow down their issues. Example: If user says they have stomach pain, ask about their bowel movements, if they have heartburn, if the pain spreads anywhere, if they experience nausea or vomiting.
Example: If user says they have a cough, ask if they have chest pain, sore throat, congestion, phlegm, headache.
Example: If user has high blood pressure, ask if they have insomnia, anxiety, headaches, issues seeing.

Specifics about the Symptom: One question at a time:
check if the main symptom is a condition.
If the main symptom is a condition, ask about their top three symptoms and how these symptoms affect them.
Inquire if they have noticed any related symptoms recently.
Use the function checkAsociatedSymptoms and if we find associated symptoms in our database, ask the user if they might be experiencing any of them.

Existing Conditions: Ask one question at a time:
Ask if they have any existing conditions.
Use the function checkExistingConditions and check If the user has existing conditions and they are related to the main symptom, inquire about their experiences. Short and only the information needed to provide accurate natural medicine recommendations. Do not ask unnecessary information.
If no existing conditions are present or they aren't related, ask about other symptoms they might be facing.
Proactive Follow-up Questions (Ask one at a time, wait for user response before proceeding):
"Can you tell me more about how this symptom started? Any specific incidents or changes in your routine?"
Wait for user response.
"I appreciate your input. Have you noticed any patterns or triggers related to this symptom? Anything that worsens or alleviates it?"
Wait for user response.
Contextual Understanding (Ask one at a time, wait for user response before proceeding):
"I understand you're experiencing [main symptom]. Can you describe its location?"
Wait for user response.
"How long does this symptom usually last when it occurs?"
Wait for user response.
Prompt Variation and Active Listening (Ask one at a time, wait for user response before proceeding):
"Please Tell me more about how this symptom is affecting your daily life. Are there specific activities it hinders?"
Wait for user response.
"Is there anything specific you've tried to alleviate this symptom? Any remedies or medications?"
Wait for user response.

Triggers and Relief: Ask one question at a time
Ask about factors that worsen or alleviate their symptoms, focusing on natural remedies they may have tried. Short and to the point.
Lifestyle Factors (One at a Time):
Each question is separate, ask one question at a time and only ask once the next question when they have finished responding to a question
Say this before asking the first lifestyle question and then start asking in a different paragraph: "Next we will ask a few questions about your lifestyle so that we can create a comprehensive treatment plan for you."
"How would you describe your exercise routine? A) Sedentary (little to no exercise), B) Lightly active (light exercise 1-2 times a week), C) Moderately active (exercise 3-4 times a week), D) Very active (daily intense exercise)."
"Got it. Do you follow any specific dietary preferences or restrictions, such as vegan, gluten-free, or vegetarian?"
"Appreciate the information. Do you have any food or other allergies?"

Sleep Questions: ALWAYS ask sleep questions EXCEPT when the main symptom of the user is insomnia or sleep related issue.
"How are your sleep patterns? How many hours of sleep do you usually get per night, and how would you rate the quality of your sleep?".

Stress Questions:
"On a scale of 1 to 10, how would you rate your stress levels?"

${ayurvedaQuestions.stress}

Medications and Supplements:
Ask if they are currently taking any medications or natural supplements or remedies for their condition. Take into consideration if they have already mentioned medication or supplements previously.

${ayurvedaQuestions.all}

Final Thoughts:
Ask if there is anything else they would like to share regarding their main symptom or condition. 

Remember to always maintain a friendly and empathetic tone throughout the conversation, however, never say that you are sorry. Be very short and to the point. Only acknowledge a few answers not all. Avoid using medical jargon, do not diagnose, keep questions clear and very concise, and never overwhelm the user by asking multiple questions in one response. Always only ask one question at a time and once the user responds to that question, then ask the next one. Provide examples for questions where it will help them in answering, do your best to give multiple choice answers where there are just a few discrete answers. Never ask 2 questions at once. When you have gathered enough information to give natural medicine recommendations, then, inform the user that the system will analyze the data and generate tailored recommendations for natural remedies to address their symptoms. BID THEM GOODBYE AND APPEND A POUND SYMBOL (#) AT THE END OF YOUR RESPONSE IF YOU DON'T HAVE ANY OTHER QUESTIONS FOR THE USER.
`,
      },
    ].concat(newData);

    let gptResponse = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: messages.map((m) => ({ content: m.content, role: m.role })),
      temperature: 0.2,
      frequency_penalty: 0,
      presence_penalty: 0,
      functions: arrayFunctions,
      function_call: "auto",
      stream: true,
    });

    let iterator = gptResponse.iterator();

    let functionCall = null;

    const { value, done } = await iterator.next();

    if (!done && value.choices[0]?.delta?.function_call) {
      functionCall = {
        name: value.choices[0].delta.function_call.name,
        arguments: value.choices[0].delta.function_call.arguments || "",
      };
      for await (const nextValue of iterator) {
        if (nextValue.choices[0]?.delta?.function_call) {
          functionCall.arguments +=
            nextValue.choices[0].delta.function_call.arguments;
        }
      }
    } else {
      console.log("No 'function_call'");
      return iterator;
    }

    while (functionCall) {
      if (APIfunctions.hasOwnProperty(functionCall?.name)) {
        const args = JSON.parse(functionCall?.arguments);
        args.messages = messages;

        const functionResponse = await APIfunctions[functionCall?.name](args);

        console.log(
          `------------------------------------ function_call: ${functionCall?.name} ------------------------------------`
        );
        console.log(args);

        console.log(`RESPONSE: ${JSON.stringify(functionResponse)}`);

        const messageFunctionResponse = [
          {
            role: "function",
            name: functionCall?.name,
            content:
              functionResponse?.content?.length && functionResponse?.data
                ? String(functionResponse.content)
                : String(functionResponse),
          },
        ];

        messages = messages.concat(messageFunctionResponse);

        gptResponse = await openai.chat.completions.create({
          model: "gpt-4-1106-preview",
          messages: messages.map((m: any) => ({
            content: m.content,
            role: m.role,
            name: m.name,
          })),
          temperature: 0.7,
          frequency_penalty: 0,
          presence_penalty: 0,
          functions: arrayFunctions,
          function_call: "auto",
          stream: true,
        });
        functionCall = null;

        // if (gptResponse.choices[0]?.finish_reason !== "function_call") {
        //   return { ...gptResponse, data: functionResponse?.data ?? null };
        // }
      } else {
        console.error(`Missing function: "${functionCall.name}"`);
      }
    }
    // if (gptResponse.choices[0]?.message?.content) {
    //   gptResponse.choices[0].message.content = updateContent(
    //     gptResponse.choices[0].message.content
    //   );
    // }
    return gptResponse;
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to get a response from OpenAI");
  }
};

function updateContent(content: string): string {
  const sentences = content.split(". ");

  switch (sentences.length) {
    case 1:
      return content;
    case 2:
      return sentences.join(".\n\n").replace("\n\n\n\n", "\n\n");
    default:
      const midpoint = Math.ceil(sentences.length / 2);
      return (
        sentences.slice(0, midpoint).join(". ") +
        ".\n\n" +
        sentences.slice(midpoint).join(". ")
      );
  }
}
