import { symptoms } from './symptoms';
const { Configuration, OpenAIApi } = require('openai')
import config from '../config'
import MedicineArticles from '../models/medicine_articles'
import * as _ from 'lodash'
import axios from "axios"
import { GPTTokens } from 'gpt-tokens'
import TreatmentMaster from '../models/masters/treatment_master'
import { Op, Sequelize } from 'sequelize'
import SymptomTreatmentsHumata from '../models/symptom_treatments_humata'
import SymptomTreatments from '../models/symptom_treatments';
import SymptomConditionMaster from '../models/symptom_condition_master';

/*
is_analyzed

0 - idle
1 - waiting for analyze
2 - in the queue
3 - being analyzed
4 - analyzed
-1 - error

*/

let cachedGptRequestsCounter = 0
let nonCachedGptRequestsCounter = 0
let currentCost = 0
let acceptCounter = 0
let processedArticles = 0
let articlesProcessedWithError = 0

let articlesBeingProcessed = 0

const openAiRequests:any = {}

const openAiErrors: any = {}

let treatmentsMaster:any = {}

let symptomsAndConditions:any = {}

let symptomsAndConditionsArr: any = []

let symptomsAndTreatmentsWithTooManyArticles:any = {}

let requestsSkippedTooManyArticles = 0

export async function smartArticleAnalyzer() {
  symptomsAndConditionsArr = (await getSymptomsAndConditions()) || []

  symptomsAndConditions = symptomsAndConditionsArr.filter((sc: any) => sc?.symptom_type === 'condition').reduce((acc: any, sc: any) => {
    acc[sc.symptom_name] = (sc.symptoms??[]).map((s: any) => s.symptom_name)

    return acc
  }, {})
  
  symptomsAndTreatmentsWithTooManyArticles = await getSymptomsAndTreatmentsWithTooManyArticles()
  
  if (
    config.NODE_ENV !== 'qa'    
  ) {
    console.log('NOT STAGING ENV');
    return
  }

   console.log('STAGING ENV - running smartArticleAnalyzer');

    treatmentsMaster = (await TreatmentMaster.findAll({})).reduce((acc:any, t:any) => {
      if(t.gpt_verb?.length){
        acc[t.treatment_name] = (t.gpt_verb??'').split(';').join(', or ')
      }
      else{
        acc[t.treatment_name] = ''
      }
  		
  		return acc
  	}, {})

  let pendingSmartInsightsArticles = (
    (await MedicineArticles.findAll({
      raw: true,
      attributes: [
        'id',
        'pubmed_id',
        'title',
        'symptoms',
        'treatments',
        'preconditions',        
        'short_text',
        'is_analyzed',
        'analyze_start_date',
        'analyze_finish_date',
        'gpt',
        'gpt4',
      ],
      limit: 40000,
      //limit: 500,
      // where: {
      //    is_analyzed: [-1,0,1,2,3,4],
      // },
      where: Sequelize.where(
        Sequelize.fn('JSON_EXTRACT', Sequelize.col('gpt4'), Sequelize.literal(`'$.status'`)),
        '=',
        'accepted'
      ),
    })) || []
  ).filter((article: any) => article.short_text?.length > 300 && (article.symptoms ?? '').split(',').length && (article.treatments ?? '').split(',').length)
  
  
  pendingSmartInsightsArticles = pendingSmartInsightsArticles.map((article: any) => {
    const symptoms = (article.symptoms ?? '').split(',').map((s: string) => s.trim()).filter((s: string) => s)
    const treatments = (article.treatments ?? '').split(',').map((s: string) => s.trim()).filter((s: string) => s)

    let occurrences = 0

    for (const symptom of symptoms) {
      occurrences += (article.short_text ?? '').split(symptom).length - 1
    }

    for (const treatment of treatments) {
      occurrences += (article.short_text ?? '').split(treatment).length - 1
    }

    article.occurrences = occurrences / (symptoms.length + treatments.length)

    return article
  })

  pendingSmartInsightsArticles = _.orderBy(pendingSmartInsightsArticles, ['occurrences'], ['desc'])

  if (pendingSmartInsightsArticles.length === 0) {
    return
  }

  for (const pendingSmartInsightsArticle of pendingSmartInsightsArticles) {
    await MedicineArticles.update(
      {
        is_analyzed: 2,
      },
      {
        where: {
          pubmed_id: pendingSmartInsightsArticle.pubmed_id,
        },
      }
    )
  }

  console.log('smartArticleAnalyzer started at', new Date())

  console.log('pendingSmartInsightsArticles:', pendingSmartInsightsArticles.length)
 
  for (const pendingSmartInsightsArticle of pendingSmartInsightsArticles) {
    while(articlesBeingProcessed >= 400){
     await wait('analyzeArticleJob: ', 60000)     
    }

    analyzeArticleJob(pendingSmartInsightsArticle, pendingSmartInsightsArticles.length)
  }
}


async function getSymptomsAndTreatmentsWithTooManyArticles(){
  const symptomsAndTreatmentsWithTooManyArticles:any = {}

  const symptomsAndTreatments = await SymptomTreatments.findAll({
    raw: true,
  })

  for(const st of symptomsAndTreatments){
    if(st?.symptom_id && st?.condition_id){
      continue
    }

    const articles = _.uniqBy((st?.articles || []), 'pubmed_id')

    if(articles?.length > 6){
      if(!symptomsAndTreatmentsWithTooManyArticles[st.symptom_name || st.condition_name]){
        symptomsAndTreatmentsWithTooManyArticles[st.symptom_name || st.condition_name] = {}
      }

      symptomsAndTreatmentsWithTooManyArticles[st.symptom_name || st.condition_name][st.treatment_name] = 1
    }
  }

  return symptomsAndTreatmentsWithTooManyArticles
}

async function analyzeArticleJob(pendingSmartInsightsArticle: any, pendingSmartInsightsArticlesLength: number){
  articlesBeingProcessed++

 console.log(`articlesBeingProcessed: ${articlesBeingProcessed}`);

  try {
    await MedicineArticles.update(
      {
        is_analyzed: 3,
        analyze_start_date: new Date(),
      },
      {
        where: {
          pubmed_id: pendingSmartInsightsArticle.pubmed_id,
        },
      }
    )

    const gpt:any = await analyzeArticle(
      pendingSmartInsightsArticle.short_text,
      pendingSmartInsightsArticle.symptoms.split(',').map((s: string) => s.trim()).filter((s: string) => s),
      pendingSmartInsightsArticle.treatments.split(',').map((s: string) => s.trim()).filter((s: string) => s),
      (pendingSmartInsightsArticle.preconditions??'').split(',').map((s: string) => s.trim()).filter((s: string) => s),
      pendingSmartInsightsArticle.gpt??null,
      pendingSmartInsightsArticle.gpt4??null
    )

    currentCost += gpt.costEstimation

    if (gpt?.status === 'accepted') {
      acceptCounter++
    }

    await MedicineArticles.update(
      {
        is_analyzed: 5,
        analyze_finish_date: new Date(),
        gpt,
      },
      {
        where: {
          pubmed_id: pendingSmartInsightsArticle.pubmed_id,
        },
      }
    )
  } catch (e) {
    console.log(e)

    await MedicineArticles.update(
      { is_analyzed: -2, gpt: {
        error: JSON.stringify(e)
      } },
      {
        where: {
          pubmed_id: pendingSmartInsightsArticle.pubmed_id,
        },
      }
    )

    articlesProcessedWithError++
  }

  processedArticles++
  console.log(
    `${processedArticles} articles processed. ${articlesProcessedWithError} articlesProcessedWithError. ${acceptCounter} accepted. ${pendingSmartInsightsArticlesLength - processedArticles} left. Current cost: ${currentCost}. requestsSkippedTooManyArticles: ${requestsSkippedTooManyArticles}. ${cachedGptRequestsCounter} cached requests. ${nonCachedGptRequestsCounter} non-cached requests.`
  )

  console.log('OPENAI ERRORS');
  console.log(openAiErrors);
  
  

  articlesBeingProcessed--

  //console.log(`articlesBeingProcessed: ${articlesBeingProcessed}`);
}

async function analyzeArticle(text: string, symptoms: string[],  treatments: string[], preconditions: string[], previousGPT: any, gpt4: any) {
  symptoms = [
    ...symptoms,
    ...preconditions
  ]

  if(previousGPT?.previousGPT){
    previousGPT.previousGPT = null
  }

  let gpt: any = {
    status: null,
    rejectionReason: '',
    questions: [],
    tokens: [],
    symptoms: {},
    symptomsAndConditions: {},
    symptomTypes: {},
    gender: null,
    age: null,
    isRCT: false,
    isCohort: false,
    isCaseControl: false,
    isQualitative: false,
    articleType: null,
    rank: null,
    statisticalSignificance: '',
    requests: 0,
    costEstimation: 0,
    numberOfParticipants: null,    
    previousGPT,
    rootCauses: null,
    preconditionsSymptoms: null,
    riskDiseases: null,
    preventTreatments: null
  }

  let result = await getCompletion(true,
    text,    
    `Did the study below involve human participants? Give an answer only containing 'yes', 'no', or 'not defined'.`,
    gpt
  )

  if (result.replace(/\W/g, '').includes('no')) {
    gpt.status = 'rejected'
    gpt.rejectionReason = 'Not a human study'
  } else {
    for (let symptom of symptoms) {
      for (let treatment of treatments) {

        if((symptomsAndTreatmentsWithTooManyArticles[symptom]??{})[treatment]){
          requestsSkippedTooManyArticles++
          continue
        }

        const treatmentVerb = (treatmentsMaster[treatment])??''

        result = await getCompletion(true,
          text,
          `Does the study below indicate that ${treatmentVerb} ${treatment} improves ${symptom} in patients? Give an answer only containing 'yes', 'no', or 'not defined'.`,
          gpt
        )

        if (result.replace(/\W/g, '').includes('yes')) {
          const gpt4Treatment = ((gpt4?.symptoms??{})[symptom]??[]).find((t: any) => t.treatment === treatment)

          let mainSymptomTreatment = false
          let recommendedDosage = null
          let keyRolesExplanation = null

          let howMuch = null

          if(gpt4Treatment){
            if(gpt4Treatment.howMuch){
              howMuch = gpt4Treatment.howMuch
            }
            else{
              howMuch = await getCompletion(false,
                text,
                `What is the expected improvement in ${symptom} for a person utilizing ${treatment}, according to the study below? Respond in one short sentence using layman's terms.`,
                gpt
              )
            } 
          }

          let keyRoles = null

          if(gpt4Treatment){
            if(gpt4Treatment.keyRoles){
              keyRoles = gpt4Treatment.keyRoles
            }
            else{
              keyRoles = await getCompletion(false,
                text,
                `Could you list the key ways in which ${treatment} helps to improve ${symptom} according to the study below? Respond in bullet points with short sentences and provide no more than four points. Each point should complete the sentence: '${treatment} plays a key role in:'`,
                gpt
              )
            }
          }

          result = await getCompletion(true,
            text,
            `Is the main goal of the study below to prove that ${treatment} improves ${symptom}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
            gpt
          )

          if (result.replace(/\W/g, '').includes('yes')) {
            mainSymptomTreatment = true

            if(gpt4Treatment){
              result = await getCompletion(true,
                text,
                `Does the study below mention the recommended dosage of ${treatment} to improve ${symptom}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
                gpt
              )
  
              if (result.replace(/\W/g, '').includes('yes')) {
                if(gpt4Treatment.recommendedDosage){
                  recommendedDosage = gpt4Treatment.recommendedDosage
                }
                else{
                  result = await getCompletion(false,
                    text,
                    `What is the recommended dosage of ${treatment} to improve ${symptom}?`,
                    gpt
                  )
    
                  recommendedDosage = result
                }
              }

              if(gpt4Treatment.keyRolesExplanation){
                keyRolesExplanation = gpt4Treatment.keyRolesExplanation
              }
              else{
                keyRolesExplanation = await getCompletion(false,
                  text,
                  `Could you explain me the key ways in which ${treatment} helps to improve ${symptom} according to the study below?`,
                  gpt
                )
              }
            }
         }

          if (!gpt.symptoms[symptom]) {
            gpt.symptoms[symptom] = []
          }

          gpt.symptoms[symptom].push({
            treatment,
            howMuch,
            keyRolesExplanation,
            keyRoles: (keyRoles??'').split('\n').map((s: string) => s.trim()),         
            mainSymptomTreatment,
            recommendedDosage,            
          })
        }
      }
    }

    if(Object.keys(gpt.symptoms).length === 0) {
      gpt.status = 'rejected'
      gpt.rejectionReason = 'No interventions found'
    }
  }

  if(!gpt.status) {
    gpt.status = 'accepted'
  }

  gpt = await analyzeSymptomCondition(gpt, text)

  gpt.requests = gpt.tokens.length
  gpt.costEstimation = (gpt.tokens.reduce((acc: number, cur: number) => acc + cur, 0) / 1000) * 0.002

  return gpt
}

async function analyzeSymptomCondition(gpt: any, text: string){
  for(const condition in (gpt.symptoms||{})){
    if(symptomsAndConditions[condition]?.length){
      for(const symptom of symptomsAndConditions[condition]){
        if(gpt.symptoms[symptom]?.length){
          const treatments = [...gpt.symptoms[symptom], ...gpt.symptoms[condition]].map((treatment: any) => treatment.treatment)

          for (let treatment of treatments) {
            const treatmentVerb = (treatmentsMaster[treatment])??''
    
            let result = await getCompletion(true,
              text,
              `Does the study below indicate that ${treatmentVerb} ${treatment} improves ${symptom} in people with ${condition}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
              gpt
            )
    
            if (result.replace(/\W/g, '').includes('yes')) {
              let mainSymptomTreatment = false
              let recommendedDosage = null
              let keyRolesExplanation = null
    
              const howMuch = await getCompletion(false,
                text,
                `What is the expected improvement in ${symptom} for a person with ${condition} utilizing ${treatment}, according to the study below? Respond in one short sentence using layman's terms.`,
                gpt
              )
    
              const keyRoles = await getCompletion(false,
                text,
                `Could you list the key ways in which ${treatment} helps to improve ${symptom} in people with ${condition} according to the study below? Respond in bullet points with short sentences and provide no more than four points. Each point should complete the sentence: '${treatment} plays a key role in:'`,
                gpt
              )
    
              result = await getCompletion(true,
                text,
                `Is the main goal of the study below to prove that ${treatment} improves ${symptom} in people with ${condition}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
                gpt
              )
    
              if (result.replace(/\W/g, '').includes('yes')) {
                mainSymptomTreatment = true
    
                result = await getCompletion(true,
                  text,
                  `Does the study below mention the recommended dosage of ${treatment} to improve ${symptom} in people with ${condition}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
                  gpt
                )
    
                if (result.replace(/\W/g, '').includes('yes')) {
                  result = await getCompletion(false,
                    text,
                    `What is the recommended dosage of ${treatment} to improve ${symptom} in people with ${condition}?`,
                    gpt
                  )
    
                  recommendedDosage = result
                }
    
                keyRolesExplanation = await getCompletion(false,
                  text,
                  `Could you explain me the key ways in which ${treatment} helps to improve ${symptom} in people with ${condition} according to the study below?`,
                  gpt
                )
             }
    
              if (!gpt.symptomsAndConditions[condition]) {
                gpt.symptomsAndConditions[condition] = {}
              }

              if (!gpt.symptomsAndConditions[condition][symptom]) {
                gpt.symptomsAndConditions[condition][symptom] = []
              }
    
              gpt.symptomsAndConditions[condition][symptom].push({
                treatment,
                howMuch,
                keyRolesExplanation,
                keyRoles: keyRoles.split('\n').map((s: string) => s.trim()),         
                mainSymptomTreatment,
                recommendedDosage,            
              })
            }
          }
        }
      }
    }
  }

  return gpt
}

function canSubmitRequest(messages: any[]){
  const tokens = getTokensCount(messages)

  const last65SecondsRequests = Object.values(openAiRequests).filter((request:any) => {
    return (new Date().getTime() - (request?.date?.getTime()??0)) < 65000
  })

  if(last65SecondsRequests.length >= 9000){
    return false
  }

  const last65SecondsTokens = last65SecondsRequests.reduce((acc: number, cur: any) => acc + cur.tokens, 0)

  if((last65SecondsTokens + tokens) > 950000){
    return false
  }

  return true
}



async function getCompletion(isShortAnswer: boolean, article: string, question: string, gpt: any,retries: number = 0): Promise<any> {
  if (!gpt.tokens) {
    gpt.tokens = []
  }

  if (!gpt.questions) {
    gpt.questions = []
  }

  const cachedAnswer = getCachedGptAnswer(question, gpt)

  if (cachedAnswer) {
    cachedGptRequestsCounter++
    gpt.tokens.push(0)
    gpt.questions.push({
      question,
      answer: cachedAnswer,
      cached: true
    })

    return cachedAnswer
  }

  nonCachedGptRequestsCounter++

  if (retries > 10) {
    console.log(question)
    console.log('GPT Too many retries')
    throw new Error('GPT Too many retries')
  }

  const messages = [{ role: 'system', content: 'You are an empathetic AI assistant, with a focus on analyzing health-related scientific articles. Your goal is to extract key information from these articles that could potentially help patients understand their symptoms and treatments better.' }, 
  { role: 'user', content: `${question}
  
  """
  ${article}
  """` }]

  const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
  })


  const openai = new OpenAIApi(configuration)

  while(!canSubmitRequest(messages)){
    await wait('RateLimit', 5000)    
  }

  updatePendingRequests(messages)

  await wait('AAAA',4000)

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-1106',      
      messages,
      temperature: 0.7,
      max_tokens: isShortAnswer?3:256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

   // console.log(`Request processed in ${ (((new Date()).getTime() - openAiRequests[requestId]?.date?.getTime())/1000) }s (${openAiRequests[requestId]?.tokens}) tokens`);
    
    gpt.tokens.push(completion?.data?.usage?.total_tokens || 0)

    const result = (completion.data.choices[0].message?.content || '').trim().toLowerCase()

    gpt.questions.push({
      question,
      answer: result,
      cached: false,
      isGPT35Turbo: true
    })


    return result

  } catch (error: any) {
    console.log('ERROR-->>')
    console.log(error?.response?.data?.error)

    if (!error?.response?.data?.error) {
      console.log(error)

      try {
        console.log(JSON.stringify(error))
      } catch (e) {}
    }

    if((error?.response?.data?.error?.type === 'invalid_request_error') && (error?.response?.data?.error?.code === 'context_length_exceeded')){
      if(!openAiErrors['context_length_exceeded']){
        openAiErrors['context_length_exceeded'] = 0
      }

      openAiErrors['context_length_exceeded']++
      
      // return await getCompletion16k(isShortAnswer, article, question, gpt, 0)
    }

    if((error?.response?.data?.error?.type === 'server_error') && ((error?.response?.data?.error?.message??'').includes('overloaded'))){
      if(!openAiErrors['overloaded']){
        openAiErrors['overloaded'] = 0
      }

      openAiErrors['overloaded']++

      await wait('getCompletion',5000)
    }
    else{
      const message = (error?.response?.data?.error?.message??'').substring(0,115)
      if(!openAiErrors[message]){
        openAiErrors[message] = 0
      }

      openAiErrors[message]++

      await wait('getCompletion',60000)
    }
    

    return await getCompletion(isShortAnswer, article, question, gpt, retries + 1)
  }
}

function getCachedGptAnswer(question: string, gpt: any) {
  if(gpt?.previousGPT?.questions?.length > 0) {
    const previousQuestion = gpt.previousGPT.questions.find((q: any) => q.question === question)

    if(previousQuestion) {
      return previousQuestion.answer
    }
  }

  return null
}

async function wait(reason: string, ms: number) {
  //console.log(`${reason}: Waiting ${ms}ms...`)

  return new Promise((resolve) => setTimeout(resolve, ms))
}


function getTokensCount(messages: any[]){
  return (+(new GPTTokens({
      model: 'gpt-3.5-turbo',
      messages
  }))?.usedTokens || 0)+256 //256 answer tokens
}

function updatePendingRequests(messages: any[]){
  const currDate = new Date()

  openAiRequests[currDate.getTime()] = {
    tokens: (+getTokensCount(messages)),
    date: currDate
  }

  cleanOldOpenAiPendingRequests()
}

function cleanOldOpenAiPendingRequests(){
  const now = new Date().getTime()

  Object.keys(openAiRequests).forEach((key: string) => {
    if((now - (+key)) > 300000){
      delete openAiRequests[key]
    }
  })
}

async function getSymptomsAndConditions() {
  const symptomsAndConditionsMaster: any[] = await SymptomConditionMaster.findAll({ raw: true })

  const symptomsTreatmentsHumata = (
    (await SymptomTreatmentsHumata.findAll({
      raw: true,
    })) ?? []
  ).filter((sth: any) => sth?.condition_id)

  const symptomsPerCondition = symptomsTreatmentsHumata.reduce((acc: any, sth: any) => {
    if (sth?.condition_id && sth?.symptom_id && sth?.symptom_name?.length) {
      if (!acc[sth?.condition_id]) {
        acc[sth?.condition_id] = []
      }

      acc[sth?.condition_id].push((sth?.symptom_name ?? '').trim().toLowerCase())
    }

    return acc
  }, {})

  for (const condition of symptomsAndConditionsMaster.filter(
    (sc: any) => sc?.symptom_type === 'condition' && sc?.symptoms?.length > 0
  )) {
    for (const conditionSymptomName of condition.symptoms
      .split(';')
      .map((x: any) => x.trim().toLowerCase())
      .filter((x: any) => x.length > 0)) {
      if (!symptomsPerCondition[condition.symptom_id]) {
        symptomsPerCondition[condition.symptom_id] = []
      }

      symptomsPerCondition[condition.symptom_id].push((conditionSymptomName ?? '').trim().toLowerCase())
    }
  }

  for (const sc of symptomsAndConditionsMaster) {
    sc.symptoms = []

    if (sc.symptom_type === 'condition' && symptomsPerCondition[+sc.symptom_id]?.length > 0) {
      sc.symptoms = _.uniq(symptomsPerCondition[+sc.symptom_id])
        .map((x: any) =>
          symptomsAndConditionsMaster.find(
            (sc: any) => sc.symptom_name.trim().toLowerCase() === x?.trim()?.toLowerCase()
          )
        )
        .filter((x: any) => x?.symptom_id && sc.symptom_id && x?.symptom_id !== sc.symptom_id)
        .map((x: any) => ({ ...x }))
    }
  }

  return symptomsAndConditionsMaster.map((sc: any) =>
    _.pick(sc, ['symptom_name', 'symptom_id', 'symptoms', 'symptom_type'])
  )
}
