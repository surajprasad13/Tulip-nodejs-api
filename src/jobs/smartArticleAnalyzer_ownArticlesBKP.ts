import { preconditions } from './../controllers/preconditions';
const { Configuration, OpenAIApi } = require('openai')
import config from '../config'
//import MedicineArticles from '../models/medicine_articles'
import * as _ from 'lodash'
import axios from "axios"
import { GPTTokens } from 'gpt-tokens'
import TreatmentMaster from '../models/masters/treatment_master'
import { Op, Sequelize } from 'sequelize'
import MedicineArticlesOwn from '../models/medicine_articles_own'

/*
is_analyzed

0 - idle
1 - waiting for analyze
2 - in the queue
3 - being analyzed
4 - analyzed
-1 - error

*/





// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!  WARNING  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


//FIX ALL UPDATES TO USE PUBMED ID INSTEAD OF THE TABLE AUTOINCREMENT ID












let cachedGptRequestsCounter = 0
let nonCachedGptRequestsCounter = 0
let currentCost = 0
let filteredByIsHumanModel = 0
let filteredByIsAcceptedModel = 0
let acceptCounter = 0
let processedArticles = 0

let articlesBeingProcessed = 0

const openAiRequests:any = {}

const openAiErrors: any = {}

let treatmentsMaster:any = {}

export async function smartArticleAnalyzer() {
  if (
    config.NODE_ENV !== 'qa'    
  ) {
    console.log('NOT QA ENV');
    return
  }

   console.log('QA ENV - running smartArticleAnalyzer');

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
    (await MedicineArticlesOwn.findAll({
      raw: true,
      attributes: [
        'id',
        'pubmed_id',
        'title',
        'symptoms',
        'treatments',
        'preconditions',
        'publication_date',
        'url',
        'short_text',
        'is_analyzed',
        'analyze_start_date',
        'analyze_finish_date',
        'gpt',
      ],
      // where: {
      //   pubmed_id: 4049052,
      // },
      // limit: 50000,
      // where: {
      //    is_analyzed: 0,
      // },
      // where: {
      //   gpt: {
      //     [Op.ne]: null
      //   }
      // }
      //where: Sequelize.where(Sequelize.fn('JSON_EXTRACT', Sequelize.col('gpt'), Sequelize.literal(`'$.status'`)), '=', 'accepted'),
      // order: [['analyze_finish_date', 'ASC']],
    })) || []
  ).filter((article: any) => article.short_text?.length > 300 && (article.symptoms ?? '').split(',').length && (article.treatments ?? '').split(',').length)
  
  //.filter((article: any) => article?.gpt?.status === 'accepted')

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

  //pendingSmartInsightsArticles = _.orderBy(pendingSmartInsightsArticles, ['occurrences'], ['desc'])

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
          id: pendingSmartInsightsArticle.id,
        },
      }
    )
  }

  console.log('smartArticleAnalyzer started at', new Date())

  console.log('pendingSmartInsightsArticles:', pendingSmartInsightsArticles.length)
  console.log('average number of symptoms per article:', pendingSmartInsightsArticles.reduce((acc: number, article: any) => acc + (article.symptoms ?? '').split(',').filter((s: string) => s).length, 0) / pendingSmartInsightsArticles.length)
  console.log('average number of treatments per article:', pendingSmartInsightsArticles.reduce((acc: number, article: any) => acc + (article.treatments ?? '').split(',').filter((s: string) => s).length, 0) / pendingSmartInsightsArticles.length)
  console.log('average number of preconditions per article:', pendingSmartInsightsArticles.reduce((acc: number, article: any) => acc + (article.preconditions ?? '').split(',').filter((s: string) => s).length, 0) / pendingSmartInsightsArticles.length)
  
  

  for (const pendingSmartInsightsArticle of pendingSmartInsightsArticles) {
    while(articlesBeingProcessed >= 20){
     await wait('analyzeArticleJob: ', 90000)     
    }

    analyzeArticleJob(pendingSmartInsightsArticle, pendingSmartInsightsArticles.length)
  }

  // await contraIndications()
}

async function analyzeArticleJob(pendingSmartInsightsArticle: any, pendingSmartInsightsArticlesLength: number){
  articlesBeingProcessed++

 // console.log(`articlesBeingProcessed: ${articlesBeingProcessed}`);

  try {
    await MedicineArticlesOwn.update(
      {
        is_analyzed: 3,
        analyze_start_date: new Date(),
      },
      {
        where: {
          id: pendingSmartInsightsArticle.id,
        },
      }
    )

    const gpt:any = await analyzeArticle(
      pendingSmartInsightsArticle.short_text,
      pendingSmartInsightsArticle.symptoms.split(',').map((s: string) => s.trim()).filter((s: string) => s),
      pendingSmartInsightsArticle.treatments.split(',').map((s: string) => s.trim()).filter((s: string) => s),
      (pendingSmartInsightsArticle.preconditions??'').split(',').map((s: string) => s.trim()).filter((s: string) => s),
      pendingSmartInsightsArticle.gpt??null
    )

    if(gpt?.rejectionReason === 'Not a human study - is human data model'){
      filteredByIsHumanModel++
    }

    if(gpt?.rejectionReason === 'Rejected by isAccepted data model'){
      filteredByIsAcceptedModel++
    }

    currentCost += gpt.costEstimation

    if (gpt?.status === 'accepted') {
      acceptCounter++
    }

    await MedicineArticlesOwn.update(
      {
        is_analyzed: 4,
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

    await MedicineArticlesOwn.update(
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
    `${processedArticles} articles processed. ${acceptCounter} accepted. ${pendingSmartInsightsArticlesLength - processedArticles} left. Current cost: ${currentCost}. Filtered by isHumanModel: ${filteredByIsHumanModel}. Filtered by isAcceptedModel: ${filteredByIsAcceptedModel}. ${cachedGptRequestsCounter} cached requests. ${nonCachedGptRequestsCounter} non-cached requests.`
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

async function analyzeArticle(text: string, symptoms: string[],  treatments: string[], preconditions: string[], previousGPT: any = null) {
  const gpt: any = {
    status: null,
    rejectionReason: '',
    questions: [],
    tokens: [],
    symptoms: {},
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

  //const isHuman = await isHumanArticle(text)

  let articleSymptoms = []
  let articlePreconditions = []

  // if(isHuman === false){
  //   gpt.status = 'rejected'
  //   gpt.rejectionReason = 'Not a human study - is human data model'

  //   return gpt
  // }

  // const isAcceptedResult = await isAccepted(text, symptoms, treatments)

  // if(isAcceptedResult === false){
  //   gpt.status = 'rejected'
  //   gpt.rejectionReason = 'Rejected by isAccepted data model'

  //   return gpt
  // }

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
          // let mainSymptomTreatment = false
          let recommendedDosage = null
          let successRate = null
          let keyRolesExplanation = null

          const howMuch = await getCompletion(false,
            text,
            `What is the expected improvement in ${symptom} for a person utilizing ${treatment}, according to the study below? Respond in one short sentence using layman's terms.`,
            gpt
          )

          const keyRoles = await getCompletion(false,
            text,
            `Could you list the key ways in which ${treatment} helps to improve ${symptom} according to the study below? Respond in bullet points with short sentences and provide no more than four points. Each point should complete the sentence: '${treatment} plays a key role in:'`,
            gpt
          )

          const acceptedPreconditions: any[] = []

          for(let precondition of preconditions){
            result = await getCompletion(true,
              text,
              `Is ${treatment} safe for people with ${precondition} according to the study below? Give an answer only containing 'yes', 'no', or 'not defined'.`,
              gpt
            )

            if (result.replace(/\W/g, '').includes('yes')) {
              result = await getCompletion(true,
                text,
                `Does the study below indicate that ${treatment} improves ${symptom} in people with ${precondition}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
                gpt
              )

              if (result.replace(/\W/g, '').includes('yes')) {
                acceptedPreconditions.push(precondition)
                
                articlePreconditions.push(precondition)
              }
            }
          }

          // result = await getCompletion(true,
          //   text,
          //   `Is the main goal of the study below to prove that ${treatment} improves ${symptom}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
          //   gpt
          // )

          // if (result.replace(/\W/g, '').includes('yes')) {
          //   mainSymptomTreatment = true

            result = await getCompletion(true,
              text,
              `Does the study below mention the recommended dosage of ${treatment} to improve ${symptom}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
              gpt
            )

            if (result.replace(/\W/g, '').includes('yes')) {
              result = await getCompletion(false,
                text,
                `What is the recommended dosage of ${treatment} to improve ${symptom}?`,
                gpt
              )

              recommendedDosage = result
            }

            keyRolesExplanation = await getCompletion(false,
              text,
              `Could you explain me the key ways in which ${treatment} helps to improve ${symptom} according to the study below?`,
              gpt
            )
         // }

          result = await getCompletion(true,
            text,
            `According to the study below, what is the percentage of people who improved ${symptom} after utilizing ${treatment}, or state 'not defined' if the information is not given? Respond with a number between 0 and 100, or 'not defined' if the answer is not clear in the study below.`,
            gpt
          )

          successRate = result

          if (!gpt.symptoms[symptom]) {
            gpt.symptoms[symptom] = []
          }

          articleSymptoms.push(symptom)

          gpt.symptoms[symptom].push({
            treatment,
            howMuch,
            keyRolesExplanation,
            keyRoles: keyRoles.split('\n').map((s: string) => s.trim()),
            preconditions: acceptedPreconditions,
       //     mainSymptomTreatment,
            recommendedDosage,
            successRate,
          })
        }
      }
    }

    if(Object.keys(gpt.symptoms).length === 0) {
      gpt.status = 'rejected'
      gpt.rejectionReason = 'No interventions found'
    }
    else{
      result = await getCompletion(true,
        text,
        `How many people were part of the study below? Provide a numeric answer or 'not defined' if the information isn't available.`,
        gpt
      )

      gpt.numberOfParticipants = result

      result = await getCompletion(true,
        text,
        `What is the gender of the participants in the study below? Provide an answer only containing 'male', 'female', 'both', or 'not defined'.`,
        gpt
      )

      gpt.gender = result
  
      result = await getCompletion(false,
        text,
        `What is the age range of the participants in the study below? Give the shortest possible answer.`,
        gpt
      )

      gpt.age = result

      //TODO
      //`What is the type of the study below? Is it a randomized controlled trial, a cohort study, a case-control study, a qualitative study, or another type? Respond with the type of the study only, such as 'randomized controlled trial', 'cohort study', 'case-control study', 'qualitative study', or 'not defined' if the information isn't available.`
  
      result = await getCompletion(true,
        text,
        `Is the study below a Randomized Controlled Trials (RCTs) study? Give an answer only containing 'yes', 'no', or 'not defined'.`,
        gpt
      )

      if (result.replace(/\W/g, '').includes('yes')) {
        gpt.isRCT = true
        gpt.articleType = 'RCT'
        gpt.rank = 1
      }
      else{
        result = await getCompletion(true, text,`Is the study below a cohort study? Give an answer only containing 'yes', 'no', or 'not defined'.`, gpt)

        if (result.replace(/\W/g, '').includes('yes')) {
          gpt.isCohort = true
          gpt.articleType = 'Cohort'
          gpt.rank = 2
        }
        else{
          result = await getCompletion(true, text,`Is the study below a case-control study? Give an answer only containing 'yes', 'no', or 'not defined'.`, gpt)

          if (result.replace(/\W/g, '').includes('yes')) {
            gpt.isCaseControl = true
            gpt.articleType = 'Case-Control'
            gpt.rank = 3
          }
          else{
            result = await getCompletion(true, text,`Is the study below a qualitative study? Give an answer only containing 'yes', 'no', or 'not defined'.`, gpt)

            if (result.replace(/\W/g, '').includes('yes')) {
              gpt.isQualitative = true
              gpt.articleType = 'Qualitative'
              gpt.rank = 4
            }
            else{
              result = await getCompletion(false, text, `What is the type of the study below?`,gpt)

              gpt.articleType = result
              gpt.rank = 4
            }
          }
        }
      }
  
  
      result = await getCompletion(false,
        text,
        `What is the statistical significance (p-value) of the study below? Provide the value of the statistical significance (p-value) or 'not defined' if the information isn't available.`,
        gpt
      )

      gpt.statisticalSignificance = result

      articleSymptoms = _.uniq(articleSymptoms)
      articlePreconditions = _.uniq(articlePreconditions)

      const symptomsAndPreconditions = _.uniq([...articleSymptoms, ...articlePreconditions])

      for (const symptomOrPrecondition of symptomsAndPreconditions) {
        result = await getCompletion(true,
          text,
          `Does the article below explicitly mention and discuss root causes of ${symptomOrPrecondition}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
          gpt
        )

        if (result.replace(/\W/g, '').includes('yes')) {
          result = await getCompletion(false,
            text,
            `According to the study below, what are the root causes of ${symptomOrPrecondition}? Please list them in bullet points, providing no more than four points.`,
            gpt
          )

          if(gpt.rootCauses == null){
            gpt.rootCauses = {}
          }

          gpt.rootCauses[symptomOrPrecondition] = result
        }

        result = await getCompletion(false,
          text,
          `According to the study below, what diseases is a person suffering from ${symptomOrPrecondition} more prone to have? Please list them in bullet points, providing no more than four points.`,
          gpt
        )

        if(gpt.riskDiseases == null){
          gpt.riskDiseases = {}
        }

        gpt.riskDiseases[symptomOrPrecondition] = result

        result = await getCompletion(true,
          text,
          `Does the article below mention any food, vitamin, mineral, or herb that prevents ${symptomOrPrecondition}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
          gpt
        )

        if (result.replace(/\W/g, '').includes('yes')) {
          result = await getCompletion(false,
            text,
            `According to the study below, what food, vitamin, mineral, or herb prevents ${symptomOrPrecondition}? Please list them in bullet points, providing no more than four points.`,
            gpt
          )

          if(gpt.preventTreatments == null){
            gpt.preventTreatments = {}
          }

          gpt.preventTreatments[symptomOrPrecondition] = result
        }
      }

      for(const symptom of articleSymptoms){
        for(const precondition of articlePreconditions){
          result = await getCompletion(true,
            text,
            `Does the study below indicate that ${precondition} causes ${symptom}? Give an answer only containing 'yes', 'no', or 'not defined'.`,
            gpt
          )

          if (result.replace(/\W/g, '').includes('yes')) {
            if(gpt.preconditionsSymptoms == null){
              gpt.preconditionsSymptoms = {}
            }

            if(gpt.preconditionsSymptoms[precondition] == null){
              gpt.preconditionsSymptoms[precondition] = []
            }

            gpt.preconditionsSymptoms[precondition].push(symptom)
          }
        }
      }
    }
  }

  if(!gpt.status) {
    gpt.status = 'accepted'
  }

  gpt.requests = gpt.tokens.length
  gpt.costEstimation = (gpt.tokens.reduce((acc: number, cur: number) => acc + cur, 0) / 1000) * 0.002

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
