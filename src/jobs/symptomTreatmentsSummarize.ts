import config from '../config'
import TreatmentMaster from '../models/masters/treatment_master'
import SymptomConditionMaster from '../models/symptom_condition_master'
import SymptomTreatments from '../models/symptom_treatments'
import SymptomTreatmentsOwn from '../models/symptom_treatments_own'
const { Configuration, OpenAIApi } = require('openai')
import * as _ from 'lodash'

let parallellProcessesRunning = 0
let totalSymptomTreatments = 0
let countProcessedSymptomTreatments = 0
let countStWithArticles = 0
let countStWithKeyRoles = 0
let countStWithExpectedImprovement = 0
let countStWithDosage = 0
let countStWithBenefit = 0

export async function symptomTreatmentsSummarize() {
  parallellProcessesRunning = 0
  totalSymptomTreatments = 0
  countProcessedSymptomTreatments = 0
  countStWithArticles = 0
  countStWithKeyRoles = 0
  countStWithExpectedImprovement = 0
  countStWithDosage = 0
  countStWithBenefit = 0
  
  if (config.NODE_ENV !== 'qa') {
    console.log('NOT QA ENV')
    return
  }

  console.log('symptomTreatmentsSummarize - QA ENV')

 // await fixDuplications()

  const symptomTreatments = [
    // ...((await SymptomTreatmentsOwn.findAll({
    //   raw: true      
    // })) ?? []).map((st: any) => ({
    //   ...st,
    //   isOwn: true
    // })),
    ...((await SymptomTreatments.findAll({  
      raw: true,      
    })) ?? []).map((st: any) => ({
      ...st,
      isOwn: false
    })),
  ]
  //.filter((st: any) =>  st?.summarized_data?.benefit?.length || st?.summarized_data?.key_roles?.length || st?.summarized_data?.dosage?.length || st?.summarized_data?.expected_improvement?.length)
  //.filter((st: any) =>  ( !st?.summarized_data?.benefit?.length && !st?.summarized_data?.key_roles?.length))
  .filter((st: any) =>  ( st.dirty === 1))

  totalSymptomTreatments = symptomTreatments.length

  const treatments = await TreatmentMaster.findAll({ raw: true })
  
  for (const symptomTreatment of symptomTreatments) {
    processSymptomTreatment(symptomTreatment, treatments)

    if(parallellProcessesRunning > 18){
      await wait(10000)
    }
  }
}

async function processSymptomTreatment(symptomTreatment: any, treatments: any[]){
  try{
    parallellProcessesRunning++

    if(symptomTreatment.isOwn){
      console.log('processSymptomTreatment isOwn not implemented');
      return
    }
    
    console.log(`symptomTreatmentsSummarize: ${countProcessedSymptomTreatments}/${totalSymptomTreatments} - ${symptomTreatment.id} - isOwn? ${symptomTreatment.isOwn}`);
    console.log(`countStWithArticles: ${countStWithArticles} | countStWithKeyRoles: ${countStWithKeyRoles} | countStWithExpectedImprovement: ${countStWithExpectedImprovement} | countStWithDosage: ${countStWithDosage} | countStWithBenefit: ${countStWithBenefit}`);
    
    symptomTreatment.summarized_data = {}

    symptomTreatment.treatment_type = treatments.find(
      (treatment: any) => +treatment.treatment_id === +symptomTreatment.treatment_id
    )?.treatment_type

    if(symptomTreatment?.articles?.length){
      countStWithArticles++
    }

    let keyRoles = [
      ...(symptomTreatment?.articles ?? [])
        .map((article: any) => article?.keyRolesExplanation || article?.keyRoles?.join('\n'))
        .filter((text: string) => text?.length > 0),
    ]
    let dosage = [
      ...(symptomTreatment?.articles ?? [])
        .map((article: any) => article?.recommendedDosage)
        .filter((text: string) => text?.length > 0),
    ]
    let expectedImprovement = [
      ...(symptomTreatment?.articles ?? [])
        .map((article: any) => article?.howMuch)
        .filter((text: string) => text?.length > 0),
    ]

    let humataKeyRoles = [...((symptomTreatment?.humata ?? []).map((h: any) => h?.key_roles).filter((t: string) => t?.length > 0))]
    let humataDosage = [...((symptomTreatment?.humata ?? []).map((h: any) => h?.dosage).filter((t: string) => t?.length > 0))]
    let humataExpectedImprovement = [...((symptomTreatment?.humata ?? []).map((h: any) => h?.expected_improvement).filter((t: string) => t?.length > 0))]

    const synonyms = _.uniq([
      ...((symptomTreatment?.humata ?? []).map((h: any) => h?.name).filter((t: string) => ((t?.length > 0) && (t !== symptomTreatment.treatment_name)))),
    ])
    
    let benefit = _.uniq([...((symptomTreatment?.humata ?? []).map((h: any) => h?.benefit).filter((t: string) => t?.length > 0))])

    keyRoles = _.uniq([...keyRoles, ...humataKeyRoles])
    dosage = _.uniq([...dosage, ...humataDosage])
    expectedImprovement = _.uniq([...expectedImprovement, ...humataExpectedImprovement])

    try {
      if (benefit.length) {
        symptomTreatment.summarized_data.benefit =
          (await combineAndAsk(
            benefit,
            getBenefitQuestionYesNo(symptomTreatment, synonyms)
          )) ?? null

          if (symptomTreatment.summarized_data.benefit.trim().toLowerCase().replace(/\W/g, '').includes('yes')) {
            countStWithBenefit++

            symptomTreatment.summarized_data.benefit =
            (await combineAndAsk(
              benefit,
              getBenefitQuestion(symptomTreatment, synonyms)
            )) ?? null
          }
          else{
            symptomTreatment.summarized_data.benefit = null
          }
      }
    } catch (e: any) {
      console.log(e)
    }

    try {
      if (keyRoles.length) {
        symptomTreatment.summarized_data.key_roles =
          (await combineAndAsk(
            keyRoles,
            getKeyRolesQuestionYesNo(symptomTreatment,synonyms)
          )) ?? null

        // symptomTreatment.summarized_data.key_roles = 'yes'

          if (symptomTreatment.summarized_data.key_roles.trim().toLowerCase().replace(/\W/g, '').includes('yes')) {
            countStWithKeyRoles++

            symptomTreatment.summarized_data.key_roles =
            (await combineAndAsk(
              keyRoles,
              getKeyRolesQuestion(symptomTreatment,synonyms)
            )) ?? null

            if (
              symptomTreatment.summarized_data.key_roles.length &&
              symptomTreatment.summarized_data.key_roles.includes('\n')
            ) {
              symptomTreatment.summarized_data.key_roles = symptomTreatment.summarized_data.key_roles
                .split('\n')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length)
                .map((kr: string) => {
                  kr = kr.replace('- ', '')
    
                  if (kr.includes('plays a key role in')) {
                    kr = kr.split('plays a key role in')[1].trim()
                  }
    
                  return kr
                })
            }
          }
          else{
            symptomTreatment.summarized_data.key_roles = null
          }
      }
    } catch (e: any) {
      console.log(e)
    }

    if (symptomTreatment?.treatment_type?.toLowerCase() !== 'lifestyle' && dosage?.length) {
      try {
        symptomTreatment.summarized_data.dosage = await combineAndAsk(
          dosage,
          getDosageQuestionYesNo(symptomTreatment,synonyms)
        )

        // symptomTreatment.summarized_data.dosage = 'yes'

        if (symptomTreatment.summarized_data.dosage.trim().toLowerCase().replace(/\W/g, '').includes('yes')) {
          countStWithDosage++

          symptomTreatment.summarized_data.dosage = await combineAndAsk(
            dosage,
            getDosageQuestion(symptomTreatment,synonyms)
          )

          if (!(symptomTreatment.summarized_data.dosage ?? '').toLowerCase().includes('the recommended dosage of')) {
            symptomTreatment.summarized_data.dosage = `the recommended dosage of ${
              symptomTreatment.treatment_name
            } to improve ${symptomTreatment.symptom_name ?? symptomTreatment.condition_name} is ${
              symptomTreatment.summarized_data.dosage
            }`
          }
        }
        else{
          symptomTreatment.summarized_data.dosage = null
        }

        
      } catch (e: any) {
        console.log(e)
      }
    }

    if (expectedImprovement?.length) {
      try {
        symptomTreatment.summarized_data.expected_improvement = await combineAndAsk(
          expectedImprovement,
          getExpectedImprovementQuestionYesNo(symptomTreatment,synonyms)
        )

        // symptomTreatment.summarized_data.expected_improvement = 'yes'

        if (symptomTreatment.summarized_data.expected_improvement.trim().toLowerCase().replace(/\W/g, '').includes('yes')) {
          countStWithExpectedImprovement++

          symptomTreatment.summarized_data.expected_improvement = await combineAndAsk(
            expectedImprovement,
            getExpectedImprovementQuestion(symptomTreatment,synonyms)
          )
        }
        else{
          symptomTreatment.summarized_data.expected_improvement = null
        }
      } catch (e: any) {
        console.log(e)
      }
    }

    // if(symptomTreatment.isOwn){
    //   await SymptomTreatmentsOwn.update(
    //     {
    //       summarized_data: symptomTreatment.summarized_data,
    //     },
    //     {
    //       where: {
    //         id: symptomTreatment.id,
    //       },
    //     }
    //   )
    // }
    // else{
      await SymptomTreatments.update(
        {
          summarized_data: symptomTreatment.summarized_data,
          dirty: 0,
        },
        {
          where: {
            id: symptomTreatment.id,
          },
        }
      )
    // }
    

  }
  catch(e: any){
    console.log(e);
  }
  finally{
    countProcessedSymptomTreatments++
    parallellProcessesRunning--
  }
}

async function fixDuplications(){
  const symptomTreatments = ((await SymptomTreatments.findAll({
    raw: true      
  })) ?? [])

  const symptomsAndConditions = ((await SymptomConditionMaster.findAll({ raw: true,
    attributes: [
      'id',
      'symptom_id',
      'symptom_name',
      'symptom_type',      
    ]
   })) || [])

  const symptomsAndConditionsById = symptomsAndConditions.reduce((acc: any, s: any) => {
    acc[+s.symptom_id] = {
      ...s,
    }

    return acc
  }, {})

  for (const symptomTreatment of symptomTreatments) {
    if(symptomTreatment.symptom_id && !symptomTreatment.condition_id){
      const duplications = symptomTreatments.filter((st: any) => (st.treatment_id === symptomTreatment.treatment_id) && !st.symptom_id && (symptomTreatment.symptom_id === st.condition_id))

      if(duplications.length){             
        await mergeSymptomTreatments(symptomTreatment, duplications[0], symptomsAndConditionsById)     
        console.log(`${symptomTreatment.id} ===>>> ${duplications[0].id}`);    
      }
    }
    
    if(!symptomTreatment.symptom_id && symptomTreatment.condition_id){
      const duplications = symptomTreatments.filter((st: any) => (st.treatment_id === symptomTreatment.treatment_id) && !st.condition_id && (symptomTreatment.condition_id === st.symptom_id))

      if(duplications.length){        
        await mergeSymptomTreatments(symptomTreatment, duplications[0], symptomsAndConditionsById)
        console.log(`${symptomTreatment.id} ===>>> ${duplications[0].id}`);   
      }


    }
  }
}

async function mergeSymptomTreatments(st1: any, st2: any, symptomsAndConditionsById: any){
  if(!st1 || !st2){
    return
  }

  if(!st1.treatment_id || !st2.treatment_id || (st1.treatment_id !== st2.treatment_id)){
    return
  }

  if(st1.symptom_id && st1.condition_id){
    return
  }

  if(st2.symptom_id && st2.condition_id){
    return
  }

  if(st1.symptom_id !== st2.condition_id){
    return
  }

  if(st1.condition_id !== st2.symptom_id){
    return
  }

  const symptomOrConditionId = symptomsAndConditionsById[st1.symptom_id || st1.condition_id]

  if(!symptomOrConditionId){
    return
  }

  console.log(`Merging st1: ${st1.id} with st2: ${st2.id}`);

  const articles = [
    ...(st1.articles??[]),
    ...(st2.articles??[]),
  ]

  const humata = [
    ...(st1.humata??[]),
    ...(st2.humata??[]),
  ]

  await SymptomTreatments.update(
    {
      articles: null,
      humata: null,
      summarized_data: null,
    },
    {
      where: {
        id: st1.id,
      },
    }
  )

  await SymptomTreatments.update(
    {
      articles: null,
      humata: null,
      summarized_data: null,
    },
    {
      where: {
        id: st2.id,
      },
    }
  )

  if(symptomOrConditionId.symptom_type === 'symptom'){
    await SymptomTreatments.update(
      {
        articles,
        humata,        
      },
      {
        where: {
          treatment_id: st1.treatment_id,
          symptom_id: symptomOrConditionId.symptom_id,
          condition_id: null,
        },
      }
    )
  }
  else{
    await SymptomTreatments.update(
      {
        articles,
        humata,        
      },
      {
        where: {
          treatment_id: st1.treatment_id,
          condition_id: symptomOrConditionId.symptom_id,
          symptom_id: null,
        },
      }
    )
  }
}

async function wait(ms: number) {
  //console.log(`${reason}: Waiting ${ms}ms...`)

  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function combineAndAsk(textList: string[], question: string, retries: number = 0): Promise<any> {
  let text: string = textList.reduce(
    (acc: string, curr: string) =>
      (acc += ` """
      ${curr}
      """\n\n`),
    ''
  )

  if (retries > 10) {
    console.log(question)
    console.log('GPT Too many retries')
    throw new Error('GPT Too many retries')
  }

  const messages = [
    {
      role: 'system',
      content:
        `You are an empathetic AI assistant, with a focus on analyzing health-related scientific articles. 
        Your goal is to extract key information from these articles that could potentially help patients understand their symptoms and treatments better.
        Do not use scientific or medical terms. Use terms people can easily understand instead of medical terms.
        Do not use abbreviations. Use full words instead of abbreviations.
        Do not refer to the pieces of text provided (for example, do not mention 'according to the text...').
        Create user friendly text with short sentences. Also, consider using items and bullet points when appropriate. Avoid overwhemling the user with too much information.
        Do not give answers specific to one gender. Try to give generic answers that would work for both genders.
        Do not give answers specific to one age group. Try to give generic answers that would work for all age groups.
        Do not mention anything about user or patient origin.
        `
    },
    {
      role: 'user',
      content: `${question}
      \n\n
      ${text}`,
    },
  ]

  const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
  })

  const openai = new OpenAIApi(configuration)

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4-1106-preview',
      messages,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const result = (completion.data.choices[0].message?.content || '')

    return result
  } catch (error: any) {
    console.log('ERROR-->>')
    console.log(error?.response?.data?.error)

    await wait(30000)

    return combineAndAsk(textList.slice(0, Math.round(textList.length * 0.8)), question, retries + 1)
  }
}

function getKeyRolesQuestion(symptomTreatment: any, synonyms: any){
  if(synonyms?.length){
    synonyms = ` (${synonyms.join('/ ')})`
  }
  else{
    synonyms = ''
  }

  if(symptomTreatment?.symptom_name?.length && symptomTreatment?.condition_name?.length){
    return `Could you list the key ways in which ${symptomTreatment.treatment_name}${synonyms} helps to improve ${symptomTreatment.symptom_name} in people with ${symptomTreatment.condition_name} according to the pieces of text below? Respond in bullet points with short sentences and provide no more than four points. Each point should complete the sentence: '${
      symptomTreatment.treatment_name
    }${synonyms} plays a key role in:'. Avoid unnecessary repetition of the treatment name (${symptomTreatment.treatment_name}) inside each bullet point sentence. Don't mention other health symptoms, conditions or diseases different from ${symptomTreatment.symptom_name} and ${symptomTreatment.condition_name}. Don't mention other treatments different from ${symptomTreatment.treatment_name}.`
  }

  return `Could you list the key ways in which ${symptomTreatment.treatment_name}${synonyms} helps to improve ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  } according to the pieces of text below? Respond in bullet points with short sentences and provide no more than four points. Each point should complete the sentence: '${
    symptomTreatment.treatment_name
  }${synonyms} plays a key role in:'.  Avoid unnecessary repetition of the treatment name (${symptomTreatment.treatment_name}) inside each bullet point sentence. Don't mention other health symptoms, conditions or diseases different from ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  }. Don't mention other treatments different from ${symptomTreatment.treatment_name}.`
}

function getKeyRolesQuestionYesNo(symptomTreatment: any, synonyms: any){
  if(synonyms?.length){
    synonyms = ` (${synonyms.join('/ ')})`
  }
  else{
    synonyms = ''
  }

  if(symptomTreatment?.symptom_name?.length && symptomTreatment?.condition_name?.length){
    return `Do the pieces of text below provide enough information about the key ways in which ${symptomTreatment.treatment_name}${synonyms} helps to improve ${symptomTreatment.symptom_name} in people with ${symptomTreatment.condition_name}? Give an answer only containing 'yes', 'no', or 'not defined'.`
  }

  return `Do the pieces of text below provide enough information about the key ways in which ${symptomTreatment.treatment_name}${synonyms} helps to improve ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  }? Give an answer only containing 'yes', 'no', or 'not defined'.`
}

function getBenefitQuestion(symptomTreatment: any, synonyms: any){
  if(synonyms?.length){
    synonyms = ` (${synonyms.join('/ ')})`
  }
  else{
    synonyms = ''
  }

  if(symptomTreatment?.symptom_name?.length && symptomTreatment?.condition_name?.length){
    return `How does ${symptomTreatment.treatment_name}${synonyms} help improve ${symptomTreatment.symptom_name} in people with ${symptomTreatment.condition_name} according to the pieces of text below? Don't mention other health symptoms, conditions or diseases different from ${symptomTreatment.symptom_name} and ${symptomTreatment.condition_name}. Don't mention other treatments different from ${symptomTreatment.treatment_name}.`
  }

  return `Could you list the key ways in which ${symptomTreatment.treatment_name}${synonyms} helps to improve ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  } according to the pieces of text below? Don't mention other health symptoms, conditions or diseases different from ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  }. Don't mention other treatments different from ${symptomTreatment.treatment_name}.`
}

function getBenefitQuestionYesNo(symptomTreatment: any, synonyms: any){
  if(synonyms?.length){
    synonyms = ` (${synonyms.join('/ ')})`
  }
  else{
    synonyms = ''
  }

  if(symptomTreatment?.symptom_name?.length && symptomTreatment?.condition_name?.length){
    return `Do the pieces of text below provide enough information about how ${symptomTreatment.treatment_name}${synonyms} helps to improve ${symptomTreatment.symptom_name} in people with ${symptomTreatment.condition_name}? Give an answer only containing 'yes', 'no', or 'not defined'.`
  }

  return `Do the pieces of text below provide enough information about how ${symptomTreatment.treatment_name}${synonyms} helps to improve ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  }? Give an answer only containing 'yes', 'no', or 'not defined'.`
}

function getDosageQuestion(symptomTreatment: any, synonyms: any){
  if(synonyms?.length){
    synonyms = ` (${synonyms.join('/ ')})`
  }
  else{
    synonyms = ''
  }

  if(symptomTreatment?.symptom_name?.length && symptomTreatment?.condition_name?.length){
    return `According to the pieces of text below what is the most common recommended dosage of ${
      symptomTreatment.treatment_name
    }${synonyms} to improve ${symptomTreatment.symptom_name} in people with ${symptomTreatment.condition_name
    }? Respond only one dosage. If you find more than one recommended dosage, choose the smallest one. The answer should complete the sentence: 'the recommended dosage of ${
      symptomTreatment.treatment_name
    }${synonyms} to improve ${symptomTreatment.symptom_name ?? symptomTreatment.condition_name} is '`
  }

  return `According to the pieces of text below what is the most common recommended dosage of ${
    symptomTreatment.treatment_name
  }${synonyms} to improve ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  }? Respond only one dosage. If you find more than one recommended dosage, choose the smallest one. The answer should complete the sentence: 'the recommended dosage of ${
    symptomTreatment.treatment_name
  }${synonyms} to improve ${symptomTreatment.symptom_name ?? symptomTreatment.condition_name} is '`
}

function getDosageQuestionYesNo(symptomTreatment: any, synonyms: any){
  if(synonyms?.length){
    synonyms = ` (${synonyms.join('/ ')})`
  }
  else{
    synonyms = ''
  }

  if(symptomTreatment?.symptom_name?.length && symptomTreatment?.condition_name?.length){
    return `Do the pieces of text below provide enough information about the recommended dosage of ${
      symptomTreatment.treatment_name
    }${synonyms} to improve ${symptomTreatment.symptom_name} in people with ${symptomTreatment.condition_name
    }? Give an answer only containing 'yes', 'no', or 'not defined'.`
  }

  return `Do the pieces of text below provide enough information about the recommended dosage of ${
    symptomTreatment.treatment_name
  }${synonyms} to improve ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  }? Give an answer only containing 'yes', 'no', or 'not defined'.`
}

function getExpectedImprovementQuestion(symptomTreatment: any, synonyms: any){
  if(synonyms?.length){
    synonyms = ` (${synonyms.join('/ ')})`
  }
  else{
    synonyms = ''
  }
  
  if(symptomTreatment?.symptom_name?.length && symptomTreatment?.condition_name?.length){
    return `According to the pieces of text below what is the expected improvement in ${
      symptomTreatment.symptom_name} in people with ${symptomTreatment.condition_name
    } for a person utilizing ${
      symptomTreatment.treatment_name
    }${synonyms}? Respond in one short sentence using layman's terms. Don't mention other health symptoms, conditions or diseases different from ${symptomTreatment.symptom_name} and ${symptomTreatment.condition_name}. Do not answer that more research or trials are needed.`
  }

  return `According to the pieces of text below what is the expected improvement in ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  } for a person utilizing ${
    symptomTreatment.treatment_name
  }${synonyms}? Respond in one short sentence using layman's terms. Don't mention other health symptoms, conditions or diseases different from ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  }. Do not answer that more research or trials are needed.`
}

function getExpectedImprovementQuestionYesNo(symptomTreatment: any, synonyms: any){
  if(synonyms?.length){
    synonyms = ` (${synonyms.join('/ ')})`
  }
  else{
    synonyms = ''
  }

  if(symptomTreatment?.symptom_name?.length && symptomTreatment?.condition_name?.length){
    return `Do the pieces of text below provide enough information about the expected improvement in ${
      symptomTreatment.symptom_name} in people with ${symptomTreatment.condition_name
    } for a person utilizing ${
      symptomTreatment.treatment_name
    }${synonyms}? Give an answer only containing 'yes', 'no', or 'not defined'.`
  }

  return `Do the pieces of text below provide enough information about the expected improvement in ${
    symptomTreatment.symptom_name ?? symptomTreatment.condition_name
  } for a person utilizing ${
    symptomTreatment.treatment_name
  }${synonyms}? Give an answer only containing 'yes', 'no', or 'not defined'.`
}