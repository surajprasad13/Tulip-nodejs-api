import { symptoms } from './symptoms';
const { Configuration, OpenAIApi } = require('openai')
import config from '../config'
import * as _ from 'lodash'
import axios from "axios"
import { GPTTokens } from 'gpt-tokens'
import TreatmentMaster from '../models/masters/treatment_master'
import { Op, Sequelize } from 'sequelize'
import SymptomTreatmentsHumata from '../models/symptom_treatments_humata'
import MedicineArticlesOwn from '../models/medicine_articles_own';
import SymptomTreatmentsOwn from '../models/symptom_treatments_own';

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

const openAiRequests:any = {}

const openAiErrors: any = {}

let treatmentsMaster:any = {}

let symptomsAndConditions:any = {}

const symptomsAndConditionsPerArticleUrl:any = {}

export async function smartArticleAnalyzerOwn() {
  // if (
  //   config.NODE_ENV !== 'qa'    
  // ) {
  //   console.log('NOT STAGING ENV');
  //   return
  // }

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


    const symptomTreatmentsOwn = ((await SymptomTreatmentsOwn.findAll({ 
      raw: true,
    })) || [])

    for(const sto of symptomTreatmentsOwn){
      for(const articleUrl of (sto.articles_urls??'').split(';')){
          if(!articleUrl.length){
              continue
          }

          if(!symptomsAndConditionsPerArticleUrl[articleUrl]){
            symptomsAndConditionsPerArticleUrl[articleUrl] = []
          }

          if(sto?.symptom_name?.length){
            symptomsAndConditionsPerArticleUrl[articleUrl].push(sto.symptom_name)
          }

          if(sto?.condition_name?.length){
            symptomsAndConditionsPerArticleUrl[articleUrl].push(sto.condition_name)
          }
      }
    }

    for(const url in symptomsAndConditionsPerArticleUrl){
      symptomsAndConditionsPerArticleUrl[url] = _.uniq(symptomsAndConditionsPerArticleUrl[url]??[])
    }

    symptomsAndConditions = (await SymptomTreatmentsHumata.findAll({
      raw: true,      
    }) || []).reduce((acc:any, s:any) => {
      const condition = (s.condition_name?.trim() ?? '').toLowerCase()
      const symptom = (s.symptom_name?.trim() ?? '').toLowerCase()

      if(condition?.length && symptom?.length){
        if(!acc[condition]){
          acc[condition] = []
        }

        acc[condition].push(symptom)
      }

      return acc
    }, {})

    
  let pendingSmartInsightsArticles = (
    (await MedicineArticlesOwn.findAll({
      raw: true,
      attributes: [
        'id',
        'pubmed_id',
        'url',
        'title',
        'symptoms',
        'treatments',
        'preconditions',        
        'short_text',
        'is_analyzed',
        'analyze_start_date',
        'analyze_finish_date',
        'gpt',
       // 'gpt4',
      ],
      // where: {
      //    is_analyzed: 0,
      // },
      limit: 30000,
      //limit: 500,
      // where: {
      //    is_analyzed: [0,1,2,3,4],
      // },
      // where: Sequelize.where(
      //   Sequelize.fn('JSON_EXTRACT', Sequelize.col('gpt4'), Sequelize.literal(`'$.status'`)),
      //   '=',
      //   'accepted'
      // ),
      // where: {
      //   url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5664031/'
      // }
    })) || []
  //).filter((article: any) => (article.is_analyzed !== 5) && article.short_text?.length > 300 && (article.symptoms ?? '').split(',').length && (article.treatments ?? '').split(',').length)
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
    await MedicineArticlesOwn.update(
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
    while(articlesBeingProcessed >= 20){
     await wait('analyzeArticleJob: ', 90000)     
    }

    analyzeArticleJob(pendingSmartInsightsArticle, pendingSmartInsightsArticles.length)
  }
}

async function analyzeArticleJob(pendingSmartInsightsArticle: any, pendingSmartInsightsArticlesLength: number){
  articlesBeingProcessed++

 console.log(`articlesBeingProcessed: ${articlesBeingProcessed}`);

  try {
    await MedicineArticlesOwn.update(
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
      [...(pendingSmartInsightsArticle.symptoms??'').split(',').map((s: string) => s.trim()).filter((s: string) => s),
        ...(symptomsAndConditionsPerArticleUrl[pendingSmartInsightsArticle?.url]??[])
      ],
      (pendingSmartInsightsArticle.treatments??'').split(',').map((s: string) => s.trim()).filter((s: string) => s),
      (pendingSmartInsightsArticle.preconditions??'').split(',').map((s: string) => s.trim()).filter((s: string) => s),
      pendingSmartInsightsArticle.gpt??null,
      pendingSmartInsightsArticle.gpt4??null
    )

    currentCost += gpt.costEstimation

    if (gpt?.status === 'accepted') {
      acceptCounter++
    }

    await MedicineArticlesOwn.update(
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

    await MedicineArticlesOwn.update(
      { is_analyzed: -1 },
      {
        where: {
          pubmed_id: pendingSmartInsightsArticle.pubmed_id,
        },
      }
    )
  }

  processedArticles++
  console.log(
    `${processedArticles} articles processed. ${acceptCounter} accepted. ${pendingSmartInsightsArticlesLength - processedArticles} left. Current cost: ${currentCost}. filteredByOwnModelsAndAcceptedByGPT3: ${filteredByOwnModelsAndAcceptedByGPT3}. ${cachedGptRequestsCounter} cached requests. ${nonCachedGptRequestsCounter} non-cached requests.`
  )

  console.log('OPENAI ERRORS');
  console.log(openAiErrors);
  
  

  articlesBeingProcessed--

  //console.log(`articlesBeingProcessed: ${articlesBeingProcessed}`);
}


async function isHumanArticle(all_text: string){
  try{
    const result = await axios.post('https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/data-models/is-human', {all_text})

    if((result.data?.is_human !== undefined) && (result.data?.is_human !== null)){
      return result.data?.is_human
    }
  }
  catch(e){
    console.log('isHumanArticle error:');
    console.log(e);
  }

  return true
}

async function isAccepted(text: string, symptoms: string[],  treatments: string[],){
  try{
    const result = await axios.post('https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/data-models/is-accepted', {
      all_text: symptoms.join(', ') + ' ' + treatments.join(', ') + ' ' + text
    })

    if((result.data?.is_accepted !== undefined) && (result.data?.is_accepted !== null)){
      return !!result.data?.is_accepted
    }
  }
  catch(e){
    console.log('isAccepted error:');
    console.log(e);
  }

  return true
}

async function analyzeArticle(text: string, symptoms: string[],  treatments: string[], preconditions: string[], previousGPT: any, gpt4: any) {

  let rejectedByOwnModels = false

  symptoms = _.uniq([
    ...symptoms,
    ...preconditions
  ])

  symptoms = _.uniq(symptoms)
  treatments = _.uniq(treatments)

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

  const isHumanModelResult = await isHumanArticle(text)
  const isAcceptedModelResult = await isAccepted(text, symptoms, treatments)

  if((isHumanModelResult === false) || (isAcceptedModelResult === false)){
    rejectedByOwnModels = true
  }

  // let result = await getCompletion(true,
  //   text,    
  //   `Did the study below involve human participants? Give an answer only containing 'yes', 'no', or 'not defined'.`,
  //   gpt
  // )

  let result = 'yes'

  if (result.replace(/\W/g, '').includes('no')) {
    gpt.status = 'rejected'
    gpt.rejectionReason = 'Not a human study'
  } else {
    for (let symptom of symptoms) {
      for (let treatment of treatments) {
        const treatmentVerb = (treatmentsMaster[treatment])??''

        // result = await getCompletion(true,
        //   text,
        //   `Does the study below indicate that ${treatmentVerb} ${treatment} improves ${symptom} in patients? Give an answer only containing 'yes', 'no', or 'not defined'.`,
        //   gpt
        // )

        result = 'yes'

        if (result.replace(/\W/g, '').includes('yes')) {
          // const gpt4Treatment = ((gpt4?.symptoms??{})[symptom]??[]).find((t: any) => t.treatment === treatment)

          const gpt4Treatment:any = {}


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

          // result = await getCompletion(true,
          //   text,
          //   `Is the main goal of the study below to prove that ${treatment} improves ${symptom}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
          //   gpt
          // )

          result = 'yes'

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

    if(rejectedByOwnModels){
      filteredByOwnModelsAndAcceptedByGPT3++
    }
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

  if(last65SecondsRequests.length >= 3200){
    return false
  }

  const last65SecondsTokens = last65SecondsRequests.reduce((acc: number, cur: any) => acc + cur.tokens, 0)

  if((last65SecondsTokens + tokens) > 82000){
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
      model: 'gpt-3.5-turbo',      
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
      
      return await getCompletion16k(isShortAnswer, article, question, gpt, 0)
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

async function getCompletion16k(isShortAnswer: boolean, article: string, question: string, gpt: any,retries: number = 0): Promise<any> {
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
      model: 'gpt-3.5-turbo-16k-0613',      
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
      
      gpt.error = {
       type: 'invalid_request_error',
       code: 'context_length_exceeded'
      }
      throw new Error('length_exceeded')
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
