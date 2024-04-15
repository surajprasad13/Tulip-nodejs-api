import { Request, Response } from 'express'
import config from '../../config'
const OpenAI = require('openai')

const generateSupplementPlan = async (req: Request, res: Response) => {
  try {
    let { treatments, chat } = req.body

    console.log('generateSupplementPlan')

    console.log(treatments)
    console.log(chat)

    const prioritySupplements = treatments.filter((t: any) => t.priority)

    let priorityText = ''

    if (prioritySupplements?.length) {
      priorityText = `Try to recommend 1 or 2 supplements from the following supplement list: ${prioritySupplements
        .map((t: any) => t.treatment_name)
        .join(', ')}. `
    }

    console.log('PRIORITY TEXT')
    console.log(priorityText)

    const messages = [
      {
        role: 'system',
        content: `You are a naturopathic doctor and your goal is to analyze your patient's health issues and give the best supplement plan considering the given list of possible supplements.`,
      },

      ...chat,
      {
        role: 'user',
        content: `
              Considering our chat messages above and the list of supplements below, create a supplement plan for me.
              ${priorityText}
              The supplement should contain approximately 4-6 supplements. You can decide the best number of supplements to recommend based on the user's symptoms, the supplements' benefits and the rules described below.
              Each of the supplements should have different benefits for the symptoms and not address the same thing. For example, if the user says their issue is allergic rhinitis, the supplements should decrease inflammation, decrease histamine reactions, support the immune system, and work as an antioxidant, rather than just focusing on one issue.
              Make sure that the supplements plan works well synergistically, will be the most effective for the user, and will improve the user's symptoms based on research information.
            Give user personalized supplement explanation in the treatment_rationale JSON object field.
            The supplement spelling must match exactly with the supplement name provided to you.
              Do not recommend any other supplements out of the supplement list below.
              Please provide your plan using an JSON array format with the same schema as the supplement list given to you e.g., [&#123;treatment_name: "...",treatment_rationale: "..."&#125;,&#123;treatment_name: "...",treatment_rationale: "..."&#125;,...]
              Do not add any additional text in your response, only JSON array of objects.
              This is the supplement list to be considered in JSON array format:    
        
              """
              ${JSON.stringify(treatments.map((t:any) => ({
                treatment_name: t?.common_names || t?.treatment_name || '',
                treatment_rationale: t?.treatment_rationale??'',

              })))}	
                     """
        
            `,
      },
    ].map((message) => ({ role: message.role, content: message.content }))

    console.log('MESSAGES: ');
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

    console.log('GPT RESPONSE: ');
    console.log(gptResponseMessage);
    

    return res.json({ info: gptResponseMessage })
  } catch (error) {
    console.log(error)

    res.status(400).send({ error })
  }
}

export { generateSupplementPlan }
