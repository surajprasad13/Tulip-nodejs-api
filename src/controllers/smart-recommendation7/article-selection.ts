import { Request, Response } from 'express'
import config from '../../config'
const OpenAI = require('openai')


const articleSelection = async (req: Request, res: Response) => {
  try {
    let { articles, chat, treatment_name } = req.body

    for(const a of articles){
      delete a.text
    }

    const messages = [
      ...chat,
      {
        role: 'user',
        content: `
              \`\`\`json
              ${JSON.stringify(articles)}	
              \`\`\`

              Given the JSON array of articles above, I would like to request your assistance in selecting the most relevant articles for me.

              I want articles talking about how ${treatment_name} can be useful in improving my health issues.

              Avoid articles not talking about ${treatment_name} or articles that are not relevant to my health issues.

              Select up to 2 articles that best match my case based on my symptoms and health profile.

              Please provide your top articles list using an JSON array format with only URL and title e.g., [&#123;url: "...",title: "..."&#125;,&#123;url: "...",title: "..."&#125;,...]
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
    

    return res.json({ info: gptResponseMessage })
  } catch (error) {
    console.log(error)

    res.status(400).send({ error })
  }
}

export { articleSelection }
