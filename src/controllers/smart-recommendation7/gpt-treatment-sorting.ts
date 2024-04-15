import { Request, Response } from 'express'
import * as _ from 'lodash'
const { Configuration, OpenAIApi } = require('openai')
import config from '../../config'
import { GPTTokens } from 'gpt-tokens'

const gptTreatmentSorting = async (req: Request, res: Response) => {
  try {
    let { treatments, chat } = req.body

    treatments = treatments.map((treatment: any) => ({
     ...treatment,
     articles:[]
    }))

    treatments = await gptTreatmentSorting_(chat, treatments)

    console.log(treatments);
    

    res.json(treatments)

  } catch (error) {
    console.log(error)

    res.status(400).send({ error })
  }
}

async function gptTreatmentSorting_(chat: any[], treatments: any[]): Promise<any[]> {
  try {
    // for(const treatment of treatments){
    //     console.log(`${treatment.treatment_name} | ${treatment.symptomsTreatments.map((st: any) => st.symptomConditionNames)}`);
    // }

    console.log('TREATMENTS')
    console.log(treatments.map((treatment: any) => treatment.treatment_name))

    let treatmentsStr = ''

    for (const treatment of treatments) {
      for (const st of treatment.symptomsTreatments ?? []) {
        if (st.symptom_name?.length && st.condition_name?.length) {
          treatmentsStr += `            
                """
                Treatment name: ${treatment.treatment_name}
                Key roles played by ${treatment.treatment_name} to improve ${st.symptom_name} in people with ${
            st.condition_name
          }: ${
            Array.isArray(st?.summarized_data?.key_roles)
              ? st?.summarized_data?.key_roles.join(' ')
              : st?.summarized_data?.key_roles ?? ''
          }
                Expected improvement in ${st.symptom_name} in people with ${st.condition_name} with ${
            treatment.treatment_name
          }: ${st?.summarized_data?.expected_improvement ?? ''}
                """
    
                `
        } else {
          treatmentsStr += `            
            """
            Treatment name: ${treatment.treatment_name}
            Key roles played by ${treatment.treatment_name} to improve ${st.symptom_name || st.condition_name}: ${
            Array.isArray(st?.summarized_data?.key_roles)
              ? st?.summarized_data?.key_roles.join(' ')
              : st?.summarized_data?.key_roles ?? ''
          }
            Expected improvement in ${st.symptom_name || st.condition_name} with ${treatment.treatment_name}: ${
            st?.summarized_data?.expected_improvement ?? ''
          }
            """

            `
        }
      }
    }

    let messages = [
      {
        role: 'system',
        content: `
          You are a Naturopathic Doctor but in your answers you should never mention that you are a doctor. 
          
          Your goal is to find the treatment that best matches your patient's complaints.
          
          Select the more personalized and more effective treatment for your patient.

          Do not use scientific or medical terms. Use terms people can easily understand instead of medical terms.
          
          Do not use abbreviations. Use full words instead of abbreviations.

          Don't mention any other symptoms or conditions that were not mentioned in the chat history. Provide your explanations considering only the patient's symptoms and conditions.
          
          Below you will find the list of treatments and treatment information you should consider.

          This is not a sorted list, you need to consider this knowledge base and your patient's information in order to give the best treatment for your patient.

          Don't recommend any treatment that is not in the list below.
          
          TREATMENT LIST

          ${treatmentsStr}
          `,
      },
      ...(chat??[]).filter((message) => message.role === 'user' || message.role === 'assistant'),
      {
        role: 'user',
        content: `
             Give me the top 6 most personalized and most effective treatments for my case.

             Try to select unique treatments that are not similar to each other. For example, do not pick both "running" and "jogging" since they are too similar to each other.

             Prioritize the treatments that are effective for the most number of symptoms and conditions.

             Answer the name of the selected treatments and a brief explanation of why you selected them.

             Split the treatment and the treatment explanation with a colon (:).

             Split the treatments by a new line.

             Your anwer should follow this format:
                <treatment name 1>:<treatment explanation 1>
                <treatment name 2>:<treatment explanation 2>
                <treatment name 3>:<treatment explanation 3>
                <treatment name 4>:<treatment explanation 4>
                <treatment name 5>:<treatment explanation 5>
                <treatment name 6>:<treatment explanation 6>
            `,
      },
    ]

    messages = messages.map((message: any) => ({ role: message.role, content: message.content }))

    // Configure OpenAI API
    const openaiApiKey = config.OPENAI_API_KEY
    const configuration = new Configuration({
      apiKey: openaiApiKey,
    })
    const gpt = new OpenAIApi(configuration)

    const gptResponse = await gpt.createChatCompletion({
      model: 'gpt-4-1106-preview',
      messages,
      max_tokens: 512,
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const gptResponseMessage = (gptResponse?.data?.choices ?? [])[0]?.message?.content ?? ''

    console.log('------------------------------------ gptTreatmentSorting ------------------------------------')
    console.log(gptResponseMessage)

    const lines = gptResponseMessage.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length)

    console.log('------------------------------------------------------------------------')

    for(const line of lines){
      console.log(line);
      
      const parts = line.split(':').map((part: string) => part.trim()).filter((part: string) => part.length)

      if(parts[0]?.length && parts[1]?.length){
        const treatment = treatments.find((treatment: any) => treatment.treatment_name.toLowerCase().replace(/\W/g,'') === parts[0].toLowerCase().replace(/\W/g,''))

        if(treatment){
          treatment.gptExplanation = parts[1]
          treatment.gptSelected = true
        }
      }
    }

    return treatments.filter((treatment: any) => treatment.gptSelected)
  } catch (error: any) {
    console.log('ERROR-->>')
    console.log(error?.response?.data?.error)

    if(treatments.length > 6){
        return gptTreatmentSorting_(chat, treatments.slice(0, treatments.length/2))
    }

    return treatments
  }
}


function getTokensCount(messages: any[]){
  return (+(new GPTTokens({
      model: 'gpt-4-0314',
      messages
  }))?.usedTokens || 0)+900
}

export { gptTreatmentSorting }