const { Configuration, OpenAIApi } = require('openai')
import config from '../config'
import * as _ from 'lodash'
import { GPTTokens } from 'gpt-tokens'
import TreatmentMaster from '../models/masters/treatment_master'
import SymptomTreatmentsHumata from '../models/symptom_treatments_humata'
import SymptomConditionMaster from '../models/symptom_condition_master'
import HealthLineArticles from '../models/healthline_articles'

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
let filteredByOwnModelsAndAcceptedByGPT3 = 0
let acceptCounter = 0
let processedArticles = 0

let articlesBeingProcessed = 0

const openAiRequests: any = {}

const openAiErrors: any = {}

let treatmentsVerbObj: any = {}

let symptomsAndConditionsArr: any = []

let treatmentsArr: any = []

export async function smartArticleAnalyzerHealthline() {
  if (
    config.NODE_ENV !== 'qa'
  ) {
    console.log('NOT QA ENV');
    return
  }

  console.log('QA ENV - running smartArticleAnalyzerHealthline')

  treatmentsArr = (await TreatmentMaster.findAll({
    raw: true
  })) || []

  treatmentsVerbObj = treatmentsArr.reduce((acc: any, t: any) => {
    if (t.gpt_verb?.length) {
      acc[t.treatment_name] = (t.gpt_verb ?? '').split(';').join(', or ')
    } else {
      acc[t.treatment_name] = ''
    }

    return acc
  }, {})

  symptomsAndConditionsArr = await getSymptomsAndConditions()

  let pendingArticles = ((await HealthLineArticles.findAll({
    raw: true,
  })) || []).map((a: any) => populateArticleSymptomsAndTreatments(a))

  for (const article of pendingArticles) {
    while (articlesBeingProcessed >= 100) {
      await wait('analyzeArticleJob: ', 90000)
    }

    analyzeArticleJob(article, pendingArticles.length)
  }
}

function populateArticleSymptomsAndTreatments(article: any) {
  article.symptoms = []
  article.treatments = []

  for(const symptom of symptomsAndConditionsArr){
    if(article.content.toLowerCase().includes(symptom.symptom_name.toLowerCase().trim())){
      article.symptoms.push(symptom)
    }
  }

  for(const treatment of treatmentsArr){
    if(article.content.toLowerCase().includes(treatment.treatment_name.toLowerCase().trim())){
      article.treatments.push(treatment)
    }
  }

  return article
}

async function analyzeArticleJob(pendingSmartInsightsArticle: any, pendingSmartInsightsArticlesLength: number) {
  console.log(pendingSmartInsightsArticle);
  
  articlesBeingProcessed++

  console.log(`articlesBeingProcessed: ${articlesBeingProcessed}`)

  try {
    await HealthLineArticles.update(
      {
        is_analyzed: 3,
        analyze_start_date: new Date(),
        symptoms: (pendingSmartInsightsArticle.symptoms||[]).map((s: any) => s.symptom_name).join(', '),
        treatments: (pendingSmartInsightsArticle.treatments||[]).map((t: any) => t.treatment_name).join(', '),
      },
      {
        where: {
          id: pendingSmartInsightsArticle.id,
        },
      }
    )

    const gpt: any = await analyzeArticle(
      pendingSmartInsightsArticle.content,
      pendingSmartInsightsArticle.symptoms
        .map((s: any) => s.symptom_name.trim())
        .filter((s: string) => s),
      pendingSmartInsightsArticle.treatments
        .map((t: any) => t.treatment_name.trim())
        .filter((s: string) => s),
      [],
      pendingSmartInsightsArticle.gpt ?? null,
      pendingSmartInsightsArticle.gpt4 ?? null
    )

    currentCost += gpt.costEstimation

    if (gpt?.status === 'accepted') {
      acceptCounter++
    }

    await HealthLineArticles.update(
      {
        is_analyzed: 5,
        analyze_finish_date: new Date(),
        gpt,
      },
      {
        where: {
          id: pendingSmartInsightsArticle.id,
        },
      }
    )
  } catch (e) {
    console.log(e)

    await HealthLineArticles.update(
      { is_analyzed: -1 },
      {
        where: {
          id: pendingSmartInsightsArticle.id,
        },
      }
    )
  }

  processedArticles++
  console.log(
    `${processedArticles} articles processed. ${acceptCounter} accepted. ${
      pendingSmartInsightsArticlesLength - processedArticles
    } left. Current cost: ${currentCost}. filteredByOwnModelsAndAcceptedByGPT3: ${filteredByOwnModelsAndAcceptedByGPT3}. ${cachedGptRequestsCounter} cached requests. ${nonCachedGptRequestsCounter} non-cached requests.`
  )

  console.log('OPENAI ERRORS')
  console.log(openAiErrors)

  articlesBeingProcessed--

  //console.log(`articlesBeingProcessed: ${articlesBeingProcessed}`);
}

async function analyzeArticle(
  text: string,
  symptoms: string[],
  treatments: string[],
  preconditions: string[],
  previousGPT: any,
  gpt4: any
) {
  let rejectedByOwnModels = false

  symptoms = [...symptoms, ...preconditions]

  if (previousGPT?.previousGPT) {
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
    preventTreatments: null,
  }

  let result = ''

  for (let symptom of symptoms) {
    for (let treatment of treatments) {
      const treatmentVerb = treatmentsVerbObj[treatment] ?? ''

      result = await getCompletion(
        true,
        text,
        `Does the article below indicate that ${treatmentVerb} ${treatment} improves ${symptom}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
        gpt
      )

      if (result.replace(/\W/g, '').includes('yes')) {
        let recommendedDosage = null
        
        let howMuch = await getCompletion(
          false,
          text,
          `What is the expected improvement in ${symptom} for a person utilizing ${treatment}, according to the article below? Respond in one short sentence using layman's terms.`,
          gpt
        )

        let keyRoles = null

        keyRoles = await getCompletion(
          false,
          text,
          `Could you list the key ways in which ${treatment} helps to improve ${symptom} according to the article below? Respond in bullet points with short sentences and provide no more than four points. Each point should complete the sentence: '${treatment} plays a key role in:'`,
          gpt
        )
     
        result = await getCompletion(
          true,
          text,
          `Does the study below mention the recommended dosage of ${treatment} to improve ${symptom}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
          gpt
        )

        if (result.replace(/\W/g, '').includes('yes')) {
          recommendedDosage = await getCompletion(
            false,
            text,
            `What is the recommended dosage of ${treatment} to improve ${symptom}?`,
            gpt
          )
        }


        if (!gpt.symptoms[symptom]) {
          gpt.symptoms[symptom] = []
        }

        gpt.symptoms[symptom].push({
          treatment,
          howMuch,
          keyRoles: (keyRoles ?? '').split('\n').map((s: string) => s.trim()),
          recommendedDosage,
        })
      }
    }
  }

  if (Object.keys(gpt.symptoms).length === 0) {
    gpt.status = 'rejected'
    gpt.rejectionReason = 'No interventions found'
  }

  if (!gpt.status) {
    gpt.status = 'accepted'

    if (rejectedByOwnModels) {
      filteredByOwnModelsAndAcceptedByGPT3++
    }
  }

  gpt.requests = gpt.tokens.length
  gpt.costEstimation = (gpt.tokens.reduce((acc: number, cur: number) => acc + cur, 0) / 1000) * 0.002

  return gpt
}


function canSubmitRequest(messages: any[]) {
  const tokens = getTokensCount(messages)

  const last65SecondsRequests = Object.values(openAiRequests).filter((request: any) => {
    return new Date().getTime() - (request?.date?.getTime() ?? 0) < 65000
  })

  if (last65SecondsRequests.length >= 8000) {
    return false
  }

  const last65SecondsTokens = last65SecondsRequests.reduce((acc: number, cur: any) => acc + cur.tokens, 0)

  if (last65SecondsTokens + tokens > 900000) {
    return false
  }

  return true
}

async function getCompletion(
  isShortAnswer: boolean,
  article: string,
  question: string,
  gpt: any,
  retries: number = 0
): Promise<any> {
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
      cached: true,
    })

    return cachedAnswer
  }

  nonCachedGptRequestsCounter++

  if (retries > 10) {
    console.log(question)
    console.log('GPT Too many retries')
    throw new Error('GPT Too many retries')
  }

  const messages = [
    {
      role: 'system',
      content:
        'You are an empathetic AI assistant, with a focus on analyzing health-related scientific articles. Your goal is to extract key information from these articles that could potentially help patients understand their symptoms and treatments better.',
    },
    {
      role: 'user',
      content: `${question}
  
  """
  ${article}
  """`,
    },
  ]

  const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
  })

  const openai = new OpenAIApi(configuration)

  while (!canSubmitRequest(messages)) {
    await wait('RateLimit', 5000)
  }

  updatePendingRequests(messages)

  await wait('AAAA', 4000)

  try {
    
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-1106',
      messages,
      temperature: 0.7,
      max_tokens: isShortAnswer ? 3 : 256,
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
      isGPT35Turbo: true,
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

    if (
      error?.response?.data?.error?.type === 'invalid_request_error' &&
      error?.response?.data?.error?.code === 'context_length_exceeded'
    ) {
      if (!openAiErrors['context_length_exceeded']) {
        openAiErrors['context_length_exceeded'] = 0
      }

      openAiErrors['context_length_exceeded']++

      // return await getCompletion16k(isShortAnswer, article, question, gpt, 0)
    }

    if (
      error?.response?.data?.error?.type === 'server_error' &&
      (error?.response?.data?.error?.message ?? '').includes('overloaded')
    ) {
      if (!openAiErrors['overloaded']) {
        openAiErrors['overloaded'] = 0
      }

      openAiErrors['overloaded']++

      await wait('getCompletion', 5000)
    } else {
      const message = (error?.response?.data?.error?.message ?? '').substring(0, 115)
      if (!openAiErrors[message]) {
        openAiErrors[message] = 0
      }

      openAiErrors[message]++

      await wait('getCompletion', 60000)
    }

    return await getCompletion(isShortAnswer, article, question, gpt, retries + 1)
  }
}

// async function getCompletion16k(isShortAnswer: boolean, article: string, question: string, gpt: any,retries: number = 0): Promise<any> {
//   if (!gpt.tokens) {
//     gpt.tokens = []
//   }

//   if (!gpt.questions) {
//     gpt.questions = []
//   }

//   const cachedAnswer = getCachedGptAnswer(question, gpt)

//   if (cachedAnswer) {
//     cachedGptRequestsCounter++
//     gpt.tokens.push(0)
//     gpt.questions.push({
//       question,
//       answer: cachedAnswer,
//       cached: true
//     })

//     return cachedAnswer
//   }

//   nonCachedGptRequestsCounter++

//   if (retries > 10) {
//     console.log(question)
//     console.log('GPT Too many retries')
//     throw new Error('GPT Too many retries')
//   }

//   const messages = [{ role: 'system', content: 'You are an empathetic AI assistant, with a focus on analyzing health-related scientific articles. Your goal is to extract key information from these articles that could potentially help patients understand their symptoms and treatments better.' },
//   { role: 'user', content: `${question}

//   """
//   ${article}
//   """` }]

//   const configuration = new Configuration({
//     apiKey: config.OPENAI_API_KEY,
//   })

//   const openai = new OpenAIApi(configuration)

//   while(!canSubmitRequest(messages)){
//     await wait('RateLimit', 5000)
//   }

//   updatePendingRequests(messages)

//   await wait('AAAA',4000)

//   try {
//     const completion = await openai.createChatCompletion({
//       model: 'gpt-3.5-turbo-16k-0613',
//       messages,
//       temperature: 0.7,
//       max_tokens: isShortAnswer?3:256,
//       top_p: 1,
//       frequency_penalty: 0,
//       presence_penalty: 0,
//     })

//    // console.log(`Request processed in ${ (((new Date()).getTime() - openAiRequests[requestId]?.date?.getTime())/1000) }s (${openAiRequests[requestId]?.tokens}) tokens`);

//     gpt.tokens.push(completion?.data?.usage?.total_tokens || 0)

//     const result = (completion.data.choices[0].message?.content || '').trim().toLowerCase()

//     gpt.questions.push({
//       question,
//       answer: result,
//       cached: false,
//       isGPT35Turbo: true
//     })

//     return result

//   } catch (error: any) {
//     console.log('ERROR-->>')
//     console.log(error?.response?.data?.error)

//     if (!error?.response?.data?.error) {
//       console.log(error)

//       try {
//         console.log(JSON.stringify(error))
//       } catch (e) {}
//     }

//     if((error?.response?.data?.error?.type === 'invalid_request_error') && (error?.response?.data?.error?.code === 'context_length_exceeded')){
//       if(!openAiErrors['context_length_exceeded']){
//         openAiErrors['context_length_exceeded'] = 0
//       }

//       openAiErrors['context_length_exceeded']++

//       gpt.error = {
//        type: 'invalid_request_error',
//        code: 'context_length_exceeded'
//       }
//       throw new Error('length_exceeded')
//     }

//     if((error?.response?.data?.error?.type === 'server_error') && ((error?.response?.data?.error?.message??'').includes('overloaded'))){
//       if(!openAiErrors['overloaded']){
//         openAiErrors['overloaded'] = 0
//       }

//       openAiErrors['overloaded']++

//       await wait('getCompletion',5000)
//     }
//     else{
//       const message = (error?.response?.data?.error?.message??'').substring(0,115)
//       if(!openAiErrors[message]){
//         openAiErrors[message] = 0
//       }

//       openAiErrors[message]++

//       await wait('getCompletion',60000)
//     }

//     return await getCompletion(isShortAnswer, article, question, gpt, retries + 1)
//   }
// }

function getCachedGptAnswer(question: string, gpt: any) {
  if (gpt?.previousGPT?.questions?.length > 0) {
    const previousQuestion = gpt.previousGPT.questions.find((q: any) => q.question === question)

    if (previousQuestion) {
      return previousQuestion.answer
    }
  }

  return null
}

async function wait(reason: string, ms: number) {
  //console.log(`${reason}: Waiting ${ms}ms...`)

  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getTokensCount(messages: any[]) {
  return (
    (+new GPTTokens({
      model: 'gpt-3.5-turbo',
      messages,
    })?.usedTokens || 0) + 256
  ) //256 answer tokens
}

function updatePendingRequests(messages: any[]) {
  const currDate = new Date()

  openAiRequests[currDate.getTime()] = {
    tokens: +getTokensCount(messages),
    date: currDate,
  }

  cleanOldOpenAiPendingRequests()
}

function cleanOldOpenAiPendingRequests() {
  const now = new Date().getTime()

  Object.keys(openAiRequests).forEach((key: string) => {
    if (now - +key > 300000) {
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
