import { Request, Response } from 'express'
import config from "../../config";
const OpenAI = require("openai");

const openaiApiKey = config.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: openaiApiKey });

const gptTreatmentDescriptions = async (req: Request, res: Response) => {
    try {
        let { treatments, symptomsAndConditions } = req.body

        const sample = treatments.map((t:string) => ({
            treatment_name: t,
            treatment_explanation: `<put here your explanation about how ${t} can improve ${symptomsAndConditions.join(', ')}>`
        }))

        let messagesArray = [
            {
              role: "system",
              content: `You are an AI expert in natural medicine. Your goal is to give short explanations about how natural medicine treatments can improve patients health issues.`,              
            },
            {
              role: "user",
              content: `
              Explain me with short sentences how ${treatments.join(', ')} can help with ${symptomsAndConditions.join(', ')}.

              Use a JSON array in your response with this format: ${JSON.stringify(sample)}`            
            },
          ];

        let gptResponse = await openai.chat.completions.create({
            messages: messagesArray,
            model: "gpt-4-turbo-preview",            
            temperature: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          });

        res.status(200).send({info:gptResponse.choices[0].message.content})
    } catch (error) {
      console.log(error)
  
      res.status(400).send({ error })
    }
  }

  export { gptTreatmentDescriptions }
