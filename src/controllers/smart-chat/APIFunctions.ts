const { Configuration, OpenAIApi } = require('openai')
import SymptomConditionMaster from '../../models/symptom_condition_master'
import config from '../../config'
import * as _ from 'lodash'
import SymptomTreatmentsHumata from '../../models/symptom_treatments_humata'

export const APIfunctions: { [key: string]: (arg: any) => Promise<any> } = {
  checkMainSymptom: async (params: any) => {
    try {
      // First check the urgent ones.
      const urgents = ['chest pain','fainting','worse head pain ever','loss of vision','gasping for air','choking','difficulty breathing','displaced or open wound fractures','sudden numbness or weakness','bleeding that cannot be stopped','intense localized abdominal pain','fever with convulsions or seizures','seizures','fever in children under 2 years old','confusion or changes in mental status','coughing or vomiting blood','severe headache','head injury','sudden inability to speak, see, walk or move','pain with urination + back pain','fever with shortness of breath or with difficulty breathing','fever over 3 days not responding to fever reducers','suicidal ideation or plan','rash or lesion on the skin with red streaking','cellulitis','periorbital swelling','difficulty swallowing','cancer','epilepsy','tumor','anorexia','bulimia','schizophrenia','bipolar','leukemia','lymphoma','septic shock','stroke','heart attack','traumatic brain injury','transient ischaemic attack','tuberculosis','blood poisoning','hallucinations','breast lump','breast dimpling','breast pain','breast skin changes']

      const urgentSymptomDetected = urgents.includes(params?.symptom.toLowerCase())

      const symptomsAndConditions = await SymptomConditionMaster.findAll({ raw: true })

      if(urgentSymptomDetected) {
        return {
          content: `The symptom ${params?.symptom.toLowerCase()} is Urgent.`,
          data: {
            main_symptom: params?.symptom?.toLowerCase(),
            type: symptomsAndConditions?.find((s: any) => s.symptom_name === params?.symptom?.toLowerCase())?.symptom_type??'symptom',
            urgentSymptomDetected
          }
        }
      } 
      // End of urgent block

      const lastUserMessage = (params?.messages ?? [])
        .filter((message: any) => message.role === 'user')
        .reverse()[0]?.content

      const symptomsAndConditionsStrList = symptomsAndConditions
        .map((symptomAndCondition: any) => symptomAndCondition.symptom_name)
        .join(', ')

      const messages = [
        {
          role: 'system',
          content: `You are a doctor diagnosing your patient. Your goal is to find the health symptom or condition that best matches your patient's complaints.

          This is a comma-separated list of symptoms and health conditions you will use to diagnose.
          
          """
          ${symptomsAndConditionsStrList}
          """`,
        },
        {
          role: 'user',
          content: `
          Considering the text below provided by your patient. Pick only one symptom or condition that best matches your patient's complaints. Answer only the name of the symptom or condition. The spelling must match exactly with one of the items from the symptom and condition list provided to you.

          """
          ${params?.symptom ?? ''}. ${lastUserMessage ?? ''}
          """
        `,
        },
      ]

      // Configure OpenAI API
      const openaiApiKey = config.OPENAI_API_KEY
      const configuration = new Configuration({
        apiKey: openaiApiKey,
      })
      const gpt = new OpenAIApi(configuration)

      const gptResponse = await gpt.createChatCompletion({
        model: 'gpt-4-0613',
        messages,
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      const symptomOrCondition = symptomsAndConditions.find(
        (symptomAndCondition: any) =>
          symptomAndCondition.symptom_name === ((gptResponse?.data?.choices ?? [])[0]?.message?.content ?? '')
      )

      if (!symptomOrCondition) {
        return 'Not able to find a match for the symptom or condition you provided.'
      }
      
      const isCondition = symptomOrCondition?.symptom_type === 'condition'

      const semiurgents = ['wheezing','shortness of breath','dizziness','blood in the urine','bloody diarrhea','depression','shortness of breath with exertion','shortness of breath at rest']

      const semiurgentSymptomDetected = semiurgents.includes(symptomOrCondition?.symptom_name)

      if(isCondition) {
        return {
          content: `The symptom ${symptomOrCondition.symptom_name} is a health condition.`,
          data: {
            main_condition: symptomOrCondition.symptom_name,
            type: symptomOrCondition.symptom_type,
            semiurgentSymptomDetected
          }
        }
      }
      else{
        return {
          content: `The symptom ${symptomOrCondition.symptom_name} is not a condition, it is a symptom that may be associated with some health condition.`,
          data: {
            main_symptom: symptomOrCondition.symptom_name,
            type: symptomOrCondition.symptom_type,
            semiurgentSymptomDetected
          }
        }   
      }
    } catch (err) {
      console.error(err)
      return false
    }
  },
  checkAsociatedSymptoms: async (params: any) => {
    try {
      let mainCondition = null

      const mainConditionStrFromPreviousMessages = (_.uniq((params?.messages ?? []).filter((m: any) => m?.data?.main_condition?.length).map((m: any) =>  (m?.data?.main_condition??'').trim()).filter((s: string) => s.length) as string[])[0])??null

      if(mainConditionStrFromPreviousMessages?.length) {
        mainCondition = (await SymptomConditionMaster.findOne({ where: { symptom_name: mainConditionStrFromPreviousMessages, symptom_type: 'condition' }, raw: true }))
      }

      if(!mainCondition && params?.condition?.length) {
        mainCondition = (await SymptomConditionMaster.findOne({ where: { symptom_name: params.condition, symptom_type: 'condition' }, raw: true }))
      }

      if(!mainCondition) {
        return 'Not able to find a match for the condition you provided.'
      }

      const symptomsOfCondition = (await SymptomTreatmentsHumata.findAll({
        where: {
          condition_name: mainCondition.symptom_name,
        },
        raw: true,
      })).map((s: any) => s.symptom_name).filter((s: any) => s?.length)

      if(!symptomsOfCondition.length) {
        return `The condition ${mainCondition.symptom_name} doesn't have any associated symptoms.`
      }

      return `The condition ${mainCondition.symptom_name} has the following associated symptoms: ${symptomsOfCondition.join(', ')}`
      
    } catch (err) {
      console.error(err)
      return false
    }
  },
  checkExistingConditions: async (params: any) => {
    try {
      const symptomsAndConditions = await SymptomConditionMaster.findAll({ raw: true })

      const lastUserMessage = (params?.messages ?? [])
        .filter((message: any) => message.role === 'user')
        .reverse()[0]?.content

      const symptomsAndConditionsStrList = symptomsAndConditions
        .map((symptomAndCondition: any) => symptomAndCondition.symptom_name)
        .join(', ')

      const messages = [
        {
          role: 'system',
          content: `You are a doctor diagnosing your patient. Your goal is to find the health symptom or condition that best matches your patient's complaints.

          This is a comma-separated list of symptoms and health conditions you will use to diagnose.
          
          """
          ${symptomsAndConditionsStrList}
          """`,
        },
        {
          role: 'user',
          content: `
          Considering the text below provided by your patient. Pick only one symptom or condition that best matches your patient's complaints. Answer only the name of the symptom or condition. The spelling must match exactly with one of the items from the symptom and condition list provided to you.

          """
          ${params?.existingConditions ?? ''}. ${lastUserMessage ?? ''}
          """
        `,
        },
      ]

      // Configure OpenAI API
      const openaiApiKey = config.OPENAI_API_KEY
      const configuration = new Configuration({
        apiKey: openaiApiKey,
      })
      const gpt = new OpenAIApi(configuration)

      const gptResponse = await gpt.createChatCompletion({
        model: 'gpt-4-0613',
        messages,
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      const symptomOrCondition = symptomsAndConditions.find(
        (symptomAndCondition: any) =>
          symptomAndCondition.symptom_name === ((gptResponse?.data?.choices ?? [])[0]?.message?.content ?? '')
      )

      if (!symptomOrCondition) {
        return 'Not able to find a match for the symptom or condition you provided.'
      }

      const isCondition = symptomOrCondition?.symptom_type === 'condition'

      if(!isCondition) {
        return {
          content: `${symptomOrCondition.symptom_name} is a symptom and not a health condition`,
          data: {
            symptom: symptomOrCondition.symptom_name,
          }
        }
      }

      const mainSymptoms = _.uniq((params?.messages ?? []).filter((m: any) => m?.data?.main_symptom?.length).map((m: any) =>  (m?.data?.main_symptom??'').trim()).filter((s: any) => s.length))
      const additionalSymptoms = _.uniq((params?.messages ?? []).filter((m: any) => m?.data?.symptom?.length).map((m: any) =>  (m?.data?.symptom??'').trim()).filter((s: any) => s.length))

      const symptomsOfCondition = (await SymptomTreatmentsHumata.findAll({
        where: {
          condition_name: symptomOrCondition.symptom_name,
        },
        raw: true,
      })).map((s: any) => s.symptom_name).filter((s: any) => s?.length)

      const mainSymptomIntercection = _.intersection(mainSymptoms, symptomsOfCondition)
      const additionalSymptomIntercection = _.intersection(additionalSymptoms, symptomsOfCondition)

      const isMainSymptomsRelatedToCondition = mainSymptomIntercection.length > 0
      const isAdditionalSymptomsRelatedToCondition = additionalSymptomIntercection.length > 0

      const mainSymptomsStatements = mainSymptomIntercection.map((s: any) => `The main symptom ${s} is related to the health condition ${symptomOrCondition.symptom_name}`).join('. ')
      const additionalSymptomsStatements = additionalSymptomIntercection.map((s: any) => `The symptom ${s} is related to the health condition ${symptomOrCondition.symptom_name}`).join('. ')

      if(isMainSymptomsRelatedToCondition){
        return {
          content: `The existing conditions are related to the main symptom. ${mainSymptomsStatements}`,
          data: {
            condition: symptomOrCondition.symptom_name,
          }
        }
      }

      if(isAdditionalSymptomsRelatedToCondition){
        return {
          content: `The existing conditions are related to the additional symptoms reported by the patient. ${additionalSymptomsStatements}`,
          data: {
            condition: symptomOrCondition.symptom_name,
          }
        }
      }
      
      return {
        content: `The existing conditions are not related to the main symptom or any other symptoms reported by the patient.`,
        data: {
          condition: symptomOrCondition.symptom_name,
        }
      }
    } catch (err) {
      console.error(err)
      return false
    }
  },
  checkMainSymptomTooGeneric: async (params: any) => {
    try {
      const symptomsAndConditions = await SymptomConditionMaster.findAll({ raw: true })

      const lastUserMessage = ((params?.messages ?? [])
      .filter((message: any) => message.role === 'user')
      .reverse()[0]?.content)??''

      const symptom = ((params?.symptom ?? '').trim().toLowerCase())

      let possibleSymptomsConditions:any[] = []

      if(await isSpecificSymptomOrCondition(symptomsAndConditions, symptom, lastUserMessage)){
        possibleSymptomsConditions.push(await getOnePossibleSpecificSymptomOrCondition(symptomsAndConditions, symptom, lastUserMessage))
      }
      else{
        possibleSymptomsConditions.push(...(await getAllPossibleSpecificSymptomOrCondition(symptomsAndConditions, symptom, lastUserMessage)))
      }

      possibleSymptomsConditions.push(...getSubSymptomsOrConditions(possibleSymptomsConditions, symptomsAndConditions))

      possibleSymptomsConditions = _.uniq(possibleSymptomsConditions)

      possibleSymptomsConditions = possibleSymptomsConditions.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s.length)

      possibleSymptomsConditions = possibleSymptomsConditions.map((s: string) => symptomsAndConditions.find((sac: any) => sac.symptom_name === s)).filter((s: any) => s)

      const semiurgents = ['wheezing','shortness of breath','dizziness','blood in the urine','bloody diarrhea','depression','shortness of breath with exertion','shortness of breath at rest']
      const urgents = ['chest pain','fainting','worse head pain ever','loss of vision','gasping for air','choking','difficulty breathing','displaced or open wound fractures','sudden numbness or weakness','bleeding that cannot be stopped','intense localized abdominal pain','fever with convulsions or seizures','seizures','fever in children under 2 years old','confusion or changes in mental status','coughing or vomiting blood','severe headache','head injury','sudden inability to speak, see, walk or move','pain with urination + back pain','fever with shortness of breath or with difficulty breathing','fever over 3 days not responding to fever reducers','suicidal ideation or plan','rash or lesion on the skin with red streaking','cellulitis','periorbital swelling','difficulty swallowing','cancer','epilepsy','tumor','anorexia','bulimia','schizophrenia','bipolar','leukemia','lymphoma','septic shock','stroke','heart attack','traumatic brain injury','transient ischaemic attack','tuberculosis','blood poisoning','hallucinations']

      const semiurgentSymptomDetected = possibleSymptomsConditions.map((s: any) => s.symptom_name).filter((s: string) => semiurgents.includes(s)).length > 0
      const urgentSymptomDetected = possibleSymptomsConditions.map((s: any) => s.symptom_name).filter((s: string) => urgents.includes(s)).length > 0
      if((possibleSymptomsConditions?.length??0) <= 1){
        return {
          content: `The symptom ${symptom} is specific. It is not a generic symptom.`,
          data: {
            semiurgentSymptomDetected,            
            urgentSymptomDetected,
            symptom_name: symptom, //FGR
            type: symptomsAndConditions?.find((s: any) => s.symptom_name === symptom)?.symptom_type??'symptom'            
          }
        }
      }

      const info = possibleSymptomsConditions.reduce((acc: any, s: any) => {
        acc += `${s.symptom_name}: \n ${s.summarized_info??''}\n`

        return acc
      }, '')


      return {
        content: `
        ${symptom} is a too general or generic symptom or condition.

        Below you will find a list of possible symptoms or conditions that best match your patient's complaints.

        Considering the information below, try to ask questions to your patient in order to narrow down the symptom or condition to a more specific one.

        ${info}
      `,
      data: {
        urgentSymptomDetected,
        semiurgentSymptomDetected,
        symptom_name: symptom,        
        type: symptomsAndConditions?.find((s: any) => s.symptom_name === symptom)?.symptom_type??'symptom',        
      }
    }
      
    } catch (err: any) {
      console.error(err)
      console.log(err?.response?.data?.error);
      
      return false
    }
  },
}

function getSubSymptomsOrConditions(possibleSymptomsConditions:string[], symptomsAndConditions: any[]) {
  const subsymptomsOrConditions:string[] = []

  for(const possibleSymptomCondition of possibleSymptomsConditions){
    const symptomAndCondition = symptomsAndConditions.find((s: any) => s.symptom_name === possibleSymptomCondition)

    if(symptomAndCondition){
      const subsymptomsOrConditionsOfSymptomOrCondition = symptomsAndConditions.filter((s: any) => +s.subsymptom_of === +symptomAndCondition.symptom_id).map((s: any) => s.symptom_name)

      subsymptomsOrConditions.push(...subsymptomsOrConditionsOfSymptomOrCondition)
    }
  }

  return subsymptomsOrConditions
}

async function isSpecificSymptomOrCondition(symptomsAndConditions: any[], symptom: string, lastUserMessage: string) {
  const symptomsAndConditionsStr = symptomsAndConditions.reduce((acc: any, s: any) => {
    acc += `${s.symptom_name}\n\n`

    return acc
  }, '')
  
  const messages = [
    {
      role: 'system',
      content: `You are a doctor diagnosing your patient. Your goal is to find the health symptom or condition most specific that best matches your patient's complaints.

      This is the list of all symptoms and health conditions you will use to diagnose.
      
      """
      ${symptomsAndConditionsStr}
      """`,
    },
    {
      role: 'user',
      content: `
      Considering the text below provided by your patient, are you able to diagnose the patient with only one specific symptom or condition?

      Answer 'yes' if you are able to diagnose the patient with only one specific symptom or condition. Answer 'no' if you are not able to diagnose the patient with a specific symptom or condition.
      
      Give an answer only containing 'yes', 'no', or 'not defined'.

      """
      ${symptom}. ${lastUserMessage}
      """
    `,
    },
  ]

  // Configure OpenAI API
  const openaiApiKey = config.OPENAI_API_KEY
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  })
  const gpt = new OpenAIApi(configuration)

  const gptResponse = await gpt.createChatCompletion({
    model: 'gpt-4-0613',
    messages,
    temperature: 0.5,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  return ((gptResponse?.data?.choices ?? [])[0]?.message?.content ?? '').replace(/\W/g, '').includes('yes')  
}


async function getAllPossibleSpecificSymptomOrCondition(symptomsAndConditions: any[], symptom: string, lastUserMessage: string) {  
  const symptomsAndConditionsStr = symptomsAndConditions.reduce((acc: any, s: any) => {    
    acc += `${s.symptom_name}\n\n`

    return acc
  }, '')
  
  const messages = [
    {
      role: 'system',
      content: `You are a doctor diagnosing your patient. Your goal is to find the health symptom or condition most specific that best matches your patient's complaints.

      This is the list of all symptoms and health conditions you will use to diagnose.

      Each symptom or condition has a summarized information that you can use to help you diagnose.
      
      """
      ${symptomsAndConditionsStr}
      """`,
    },
    {
      role: 'user',
      content: `
      Considering the text below provided by your patient, give me a list of up to 30 most likely symptoms or conditions that best match your patient's complaints.

      Answer only the name of the symptom or condition. 
      
      The spelling must match exactly with one of the items from the symptom and condition list provided to you.

      Your answer should be a comma separate list of symptoms or conditions.

      """
      ${symptom}. ${lastUserMessage}
      """
    `,
    },
  ]

  // Configure OpenAI API
  const openaiApiKey = config.OPENAI_API_KEY
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  })
  const gpt = new OpenAIApi(configuration)

  const gptResponse = await gpt.createChatCompletion({
    model: 'gpt-4-0613',
    messages,
    temperature: 0.5,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  const response = (gptResponse?.data?.choices ?? [])[0]?.message?.content ?? ''

  // if(response.includes(',')){
  //   return response.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s.length)
  // }

  // return []

  return response.split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s.length) //FGR
}

async function getOnePossibleSpecificSymptomOrCondition(symptomsAndConditions: any[], symptom: string, lastUserMessage: string) {
  const symptomsAndConditionsStr = symptomsAndConditions.reduce((acc: any, s: any) => {    
    acc += `${s.symptom_name}\n\n`

    return acc
  }, '')
  
  const messages = [
    {
      role: 'system',
      content: `You are a doctor diagnosing your patient. Your goal is to find the health symptom or condition most specific that best matches your patient's complaints.

      This is the list of all symptoms and health conditions you will use to diagnose.

      Each symptom or condition has a summarized information that you can use to help you diagnose.
      
      """
      ${symptomsAndConditionsStr}
      """`,
    },
    {
      role: 'user',
      content: `
      Considering the text below provided by your patient, pick only one symptom or condition that best matches your patient's complaints. 
      
      Answer only the name of the symptom or condition. 
      
      The spelling must match exactly with one of the items from the symptom and condition list provided to you.

      """
      ${symptom}. ${lastUserMessage}
      """
    `,
    },
  ]

  // Configure OpenAI API
  const openaiApiKey = config.OPENAI_API_KEY
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  })
  const gpt = new OpenAIApi(configuration)

  const gptResponse = await gpt.createChatCompletion({
    model: 'gpt-4-0613',
    messages,
    temperature: 0.5,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  const response = (gptResponse?.data?.choices ?? [])[0]?.message?.content ?? ''

  if(response.length){
    return response.trim().toLowerCase()
  }

  return ''
}