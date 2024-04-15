import { Request, Response } from 'express'
import config from '../../config'
const OpenAI = require('openai')


const checkSymptomInputText = async (req: Request, res: Response) => {
  try {
    let { text } = req.body

    console.log('checkSymptomInputText');
    console.log(text);

    const messages = [
      {
        role: 'system',
        content: 'You are a doctor diagnosing a patient.',
      },  
      {
        role: 'user',
        content: `
              This is the message sent by your patient:

              \`\`\`
              ${text||''}	
              \`\`\`

              It was expected that the patient would give the following list of information items:

              - symptoms and conditions
              - frequency of symptoms and conditions
              - severity of symptoms and conditions
              - duration of symptoms and conditions when they happen
              - days, months, or even years that the patient is suffering from the symptoms and conditions
              - patient gender
              - patient age

              Did the user provide at least half of the items above? Answer only yes, no, or not sure.
            `,
      },
    ].map((message) => ({ role: message.role, content: message.content }))

    console.log('messages');
    console.log(messages);    
    

    // Configure OpenAI API
    const openaiApiKey = config.OPENAI_API_KEY
    const gpt = new OpenAI({ apiKey: openaiApiKey })

    const gptResponse = await gpt.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const gptResponseMessage = (gptResponse?.choices ?? [])[0]?.message?.content ?? ''

    console.log('gptResponseMessage');
    console.log(gptResponseMessage);
    

    return res.json({ containsEnoughInformation: (gptResponseMessage||'').toLowerCase().includes('yes') })
  } catch (error) {
    console.log(error)

    res.status(400).send({ error })
  }
}

export { checkSymptomInputText }
