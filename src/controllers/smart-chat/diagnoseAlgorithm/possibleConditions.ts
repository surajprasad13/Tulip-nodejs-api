import * as _ from 'lodash'
const { Configuration, OpenAIApi } = require('openai')
import config from '../../../config'
import SymptomTreatmentsHumata from '../../../models/symptom_treatments_humata'

export async function possibleConditions(
  main_symptoms_conditions: any[],
  other_symptoms_conditions: any[],
  symptomsAndConditionsMaster: any[],
  chat: any[],
  pdfdata = true
) {
  console.log(`PDFDATA: ${pdfdata}`);
  
  const userSymptomsNames = _.uniq([...main_symptoms_conditions, ...other_symptoms_conditions])

  const mainSymptomsConditionsTypes = (main_symptoms_conditions??[]).map((x: any) => symptomsAndConditionsMaster.find((sc: any) => sc?.symptom_name?.trim()?.toLowerCase() === x?.trim()?.toLowerCase())?.symptom_type).filter((x: any) => x)

  if(mainSymptomsConditionsTypes?.length && !mainSymptomsConditionsTypes.includes('symptom')){
    console.log('MAIN SYMPTOMS ARE CONDITIONS');
    console.log(main_symptoms_conditions);    
    
    return []
  }

  let symptomsPerCondition:any = {}

  if(pdfdata){
    const symptomsTreatmentsHumata = (
      (await SymptomTreatmentsHumata.findAll({
        where: {
          symptom_name: userSymptomsNames,
        },
        raw: true,
      })) ?? []
    ).filter((sth: any) => sth?.condition_id)
  
    symptomsPerCondition = symptomsTreatmentsHumata.reduce((acc: any, sth: any) => {
      if (!acc[sth?.condition_id]) {
        acc[sth?.condition_id] = []
      }
  
      acc[sth?.condition_id].push(sth?.symptom_name)
  
      return acc
    }, {})
  }
  

  for (const condition of symptomsAndConditionsMaster.filter(
    (sc: any) => sc?.symptom_type === 'condition' && sc?.symptoms?.length > 0
  )) {
    for (const conditionSymptomName of condition.symptoms
      .split(';')
      .map((x: any) => x.trim().toLowerCase())
      .filter((x: any) => x.length > 0)) {
      if (userSymptomsNames.includes(conditionSymptomName)) {
        if (!symptomsPerCondition[condition.symptom_id]) {
          symptomsPerCondition[condition.symptom_id] = []
        }

        symptomsPerCondition[condition.symptom_id].push(conditionSymptomName)
      }
    }
  }

  for (const conditionId in symptomsPerCondition) {
    symptomsPerCondition[conditionId] = _.uniq(symptomsPerCondition[conditionId])
  }

  console.log(symptomsPerCondition)

  if(doesUserSymptomsMatchWithUserConditions(userSymptomsNames, symptomsAndConditionsMaster, symptomsPerCondition)){
    console.log('USER SYMPTOMS MATCH WITH USER CONDITIONS');
    
    return []
  }

  let conditions = []

  for (const conditionId in symptomsPerCondition) {
    const condition = symptomsAndConditionsMaster.find((sc: any) => +sc?.symptom_id === +conditionId)

    if (condition) {
      condition.symptomsNames = [...symptomsPerCondition[conditionId]]

      conditions.push(condition)
    }
  }

  conditions.sort((a: any, b: any) => b.symptomsNames.length - a.symptomsNames.length)

  const top1 = conditions[0]
  const middleOne = conditions[Math.round(conditions.length * 0.5)]

  if((top1?.symptomsNames?.length??0) <= (1.5*(middleOne?.symptomsNames?.length??0))){
    console.log(top1?.symptomsNames?.length);
    console.log(middleOne?.symptomsNames?.length);
    console.log('LOW ACCURACY DETECTED');
    
    return []
  }

  console.log(`AFTER SORTING PER NUMBER OF SYMPTOMS`)

  for (const condition of conditions) {
    console.log(`${condition.symptom_name} ==>> ${condition.symptomsNames}`)
  }

  for (const condition of conditions) {
    condition.sortIndexSymptoms = ((condition?.symptomsNames?.length??0)/(conditions[0]?.symptomsNames?.length??0))*100  
  }

  conditions = await sortPossibleConditionsPerSummarizedInfo(conditions, chat)

  console.log('AFTER GPT SORTING')

  for (const condition of conditions) {
    console.log(`${condition.symptom_name} (idx: ${condition.sortIndex}) ==>> ${condition.symptomsNames}`)
  }

  conditions = _.uniqBy(conditions.map((c: any) => {
    if(+c?.diagnose_algorithm_replace){
      const replaceCondition = symptomsAndConditionsMaster.find((sc: any) => +sc?.symptom_id === +c?.diagnose_algorithm_replace)

      if(replaceCondition){
        c = replaceCondition
      }
    }

    return c
  }), 'symptom_id')

  return conditions
}

function doesUserSymptomsMatchWithUserConditions(userSymptomsConditionsNames: any, symptomsAndConditionsMaster: any, symptomsPerCondition: any){
  const userSymptomsConditions = userSymptomsConditionsNames.map((x: any) => symptomsAndConditionsMaster.find((y: any) => y.symptom_name.trim().toLowerCase() === x.trim().toLowerCase()) ?? null).filter((x: any) => x)

  const userSymptoms = userSymptomsConditions.filter((x: any) => x.symptom_type === 'symptom')
  const userConditions = userSymptomsConditions.filter((x: any) => x.symptom_type === 'condition')

  console.log('userSymptoms');
  console.log(userSymptoms.map((x: any) => x.symptom_name));

  console.log('userConditions');
  console.log(userConditions.map((x: any) => x.symptom_name));
  
  if(userConditions.length === 0){
    return false
  }

  const allSymptomsNamesFromUserConditions = userConditions.reduce((acc: any, uc: any) => {
    acc = [...acc, ...symptomsPerCondition[uc.symptom_id]]
    return acc
  }, [])

  const userSymptomsNames = userSymptoms.map((x: any) => x.symptom_name)

  const userSymptomsNamesThatAreAlsoSymptomsFromUserConditions = userSymptomsNames.filter((x: any) => allSymptomsNamesFromUserConditions.includes(x))

  if(userSymptomsNamesThatAreAlsoSymptomsFromUserConditions?.length >= (0.8*userSymptomsNames?.length)){
    return true
  }

  console.log('USER SYMPTOMS DOES NOT MATCH WITH USER CONDITIONS');

  console.log('userSymptomsNames');
  console.log(userSymptomsNames);

  console.log('userConditions');
  console.log((userConditions??[]).map((x: any) => x.symptom_name));

  console.log('allSymptomsNamesFromUserConditions');
  console.log(allSymptomsNamesFromUserConditions);

  console.log('userSymptomsNamesThatAreAlsoSymptomsFromUserConditions');
  console.log(userSymptomsNamesThatAreAlsoSymptomsFromUserConditions);

  return false
}

async function sortPossibleConditionsPerSummarizedInfo(
  possibleConditions: any[],
  chat: any[],
  retries = 0
): Promise<any> {
  if ((possibleConditions?.length ?? 0) <= 2) {
    return possibleConditions
  }

  possibleConditions = possibleConditions.slice(0, Math.round(possibleConditions.length * 0.5))

  const possibleConditionsStrList = possibleConditions.reduce((acc: any, pc: any) => {
    acc += `
      - ${pc?.symptom_name}: ${pc?.summarized_info}.
      `
    return acc
  }, '')

  try {
    const messages = [
      {
        role: 'system',
        content: `You are a doctor diagnosing your patient. Your goal is to find the health condition that best matches your patient's complaints.`,
      },
      ...chat,
      {
        role: 'system',
        content: `
        
        Below you will find a list with ${
          possibleConditions?.length ?? 0
        } possible health conditions that match your patient's complaints.
  
        There is a summarized information about each of the possible conditions right after the condition name.
  
        Please sort the list below by dragging and dropping the health conditions in the order of how likely you think they are to be the correct diagnosis for your patient.
  
        In case of doubt, use all the medical knowledge you have to prioritize the health conditions most common to occur in general people.
        
        Answer only the name of the symptoms or conditions separated by a comma in the order of how likely you think they are to be the correct diagnosis for your patient.
  
        The first item in the list is the most likely diagnosis and the last item in the list is the least likely diagnosis.
  
        The spelling must match exactly with the ones from the condition list provided to you.
  
            Don't provide any condition that is not in the list.
      
            """
            ${possibleConditionsStrList}	
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
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const gptResponseMessage = (gptResponse?.data?.choices ?? [])[0]?.message?.content ?? ''

    for (const possibleCondition of possibleConditions) {
      possibleCondition.sortIndexGPT = null
    }

    const sortedConditionsNames = gptResponseMessage
      .split(',')
      .map((x: any) => x.trim().toLowerCase())
      .filter((x: any) => x.length > 0)

    let idx = 0
    for (const sortedConditionName of sortedConditionsNames) {
      const sortedCondition = possibleConditions.find(
        (pc: any) => pc?.symptom_name.trim().toLowerCase() === sortedConditionName
      )

      if (sortedCondition) {
        sortedCondition.sortIndexGPT = idx
      }

      idx++
    }

    for (const sortedConditionName of sortedConditionsNames) {
      const sortedCondition = possibleConditions.find(
        (pc: any) => pc?.symptom_name.trim().toLowerCase() === sortedConditionName
      )

      if(sortedCondition){
        if(sortedCondition.sortIndexGPT === null){
          sortedCondition.sortIndexGPT = 100
        }
        else{
          sortedCondition.sortIndexGPT = (((idx-1) - sortedCondition.sortIndexGPT)/(idx-1))*100
        }
      }
    }
  } catch (err: any) {
    console.log(err)

    console.log('ERROR -->>')

    console.log(err?.response?.data?.error)

    if (retries < 10) {
      await wait(5000)
      return await sortPossibleConditionsPerSummarizedInfo(possibleConditions, chat, retries + 1)
    }
  }

  possibleConditions.sort((a: any, b: any) => (((b.sortIndexGPT??0) + (b.sortIndexSymptoms??0))/2) - (((a.sortIndexGPT??0) + (a.sortIndexSymptoms??0))/2))

  return possibleConditions.slice(0, 10)
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
