import * as _ from 'lodash'
const OpenAI = require("openai");
import config from '../../../config'

export async function extractSymptomsAndConditions(symptomsAndConditionsMaster: any[], chat: any[]) {  
  let main_symptoms_conditions: string[] = []

   let other_symptoms_conditions = (chat ?? [])
    .map((message: any) => ((message?.data?.symptom || message?.data?.condition) ?? '').trim().toLowerCase())
    .filter((x: any) => x.length > 0)

  let allSymptomsAndConditions = []

  for (const symptomAndConditionMaster of symptomsAndConditionsMaster) {
    if (symptomAndConditionMaster?.symptom_name?.length) {
      allSymptomsAndConditions.push(symptomAndConditionMaster.symptom_name)
    }
    if (symptomAndConditionMaster?.symptoms?.length) {
      const symptoms = symptomAndConditionMaster.symptoms
        .split(';')
        .map((x: any) => x.trim().toLowerCase())
        .filter((x: any) => x.length > 0)

      allSymptomsAndConditions.push(...symptoms)
    }
  }

  allSymptomsAndConditions = _.uniq(allSymptomsAndConditions)

  const symptomsAndConditionsStrList = allSymptomsAndConditions.join(', ')

  const mainSymptomCondition = await extractMainSymptomCondition(chat, symptomsAndConditionsStrList)

  if(mainSymptomCondition){
    main_symptoms_conditions.push(mainSymptomCondition)
  }

  const messages = [
    {
      role: 'system',
      content: `You are a doctor diagnosing your patient. Your goal is to find the health symptom or condition that best matches your patient's complaints.`,
    },

    ...chat,
    {
      role: 'user',
      content: `
		  Considering our chat messages above and the list of symptoms and conditions below, pick all symptoms and conditions that best matches my complaints. 
      Also add my existing health conditions.
      Don't diagnose me, just provide a list of symptoms or conditions that I really mentioned or confirmed in our chat.
      Answer only the name of the symptoms or conditions separated by a comma.  
      The spelling must match exactly with the ones from the symptom and condition list provided to you.
		  Don't provide any symptom or condition that is not in the list.

	
		  """
		  ${symptomsAndConditionsStrList}	
		         """
	
		`,
    },
  ]
  
  // Configure OpenAI API
  const openaiApiKey = config.OPENAI_API_KEY
  const gpt = new OpenAI({ apiKey: openaiApiKey });

  const gptResponse = await gpt.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: messages.map((message) => ({ role: message.role, content: message.content })),
    temperature: 0.5,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  const gptResponseMessage = (gptResponse?.choices??[])[0]?.message?.content ?? ''

  other_symptoms_conditions = _.uniq([
    ...other_symptoms_conditions,
    ...gptResponseMessage
      .split(',')
      .map((x: any) => x.trim().toLowerCase())
      .filter((x: any) => x.length > 0),
  ])

  main_symptoms_conditions = _.uniq(main_symptoms_conditions.map((x: any) => x.trim().toLowerCase()).filter((x: any) => x.length > 0))

  other_symptoms_conditions = _.uniq(_.difference(other_symptoms_conditions, main_symptoms_conditions))

  return {
    main_symptoms_conditions,
    other_symptoms_conditions,
  }
}


async function extractMainSymptomCondition(chat: any[], symptomsAndConditionsStrList: string){
  const initialMessages = chat.slice(0, 5)

  const messages:any = [
    {
      role: 'system',
      content: `Your goal is to find the health symptom or condition that best matches your patient's main issue. Do not diagnose the patient. Just provide the symptom or condition that best matches the patient's main issue.`,
    },
    ...initialMessages,
    {
      role: 'user',
      content: `
		  Considering our chat messages above and the list of symptoms and conditions below, pick the symptom or condition that best matches my main issue. 
      Answer only the name of the symptom or condition.
      Give me only one symptom or condition.  
      The spelling must match exactly with the ones from the symptom and condition list provided to you.
		  Don't provide any symptom or condition that is not in the list.
	
		  """
		  ${symptomsAndConditionsStrList}	
      """	
		`,
    },
  ]

  // Configure OpenAI API
  const openaiApiKey = config.OPENAI_API_KEY
  const gpt = new OpenAI({ apiKey: openaiApiKey });

  const gptResponse = await gpt.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: messages.map((message: any) => ({ role: message.role, content: message.content })),
    temperature: 0.5,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  const gptResponseMessage = (gptResponse?.choices??[])[0]?.message?.content ?? ''

  if(gptResponseMessage.length > 2){    
    return gptResponseMessage
  }

  return null
}