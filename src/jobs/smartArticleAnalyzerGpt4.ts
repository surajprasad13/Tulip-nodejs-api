import config from '../config'
import MedicineArticles from '../models/medicine_articles'
import { Op, Sequelize } from 'sequelize'
import TreatmentMaster from '../models/masters/treatment_master'
const { Configuration, OpenAIApi } = require('openai')
import * as _ from 'lodash'

let cachedGpt4RequestsCounter = 0
let nonCachedGpt4RequestsCounter = 0
let acceptCounter = 0
let articlesProcessed = 0
let articlesBeingProcessed = 0
let totalArticles = 0
let notHumanArticles = 0
const openAiErrors: any = {}

let treatmentsMaster: any = {}

export async function smartArticleAnalyzerGpt4() {
  if (config.NODE_ENV !== 'dev') {
    console.log('NOT QA ENV')
    return
  }

  console.log('QA ENV - running smartArticleAnalyzerGpt4')

  treatmentsMaster = (await TreatmentMaster.findAll({})).reduce((acc: any, t: any) => {
    if (t.gpt_verb?.length) {
      acc[t.treatment_name] = (t.gpt_verb ?? '').split(';').join(', or ')
    } else {
      acc[t.treatment_name] = ''
    }

    return acc
  }, {})

  const articles = await getArticles()

  console.log(`Articles to process: ${articles.length}`)

  await wait(10000)

  totalArticles = articles.length

  for (const article of articles) {
    analyzeArticle(article.short_text, article.gpt, article.gpt4, article.pubmed_id)

    if(articlesBeingProcessed > 100){
      await wait(60000)
    }
  }
}

async function analyzeArticle(text: string, gpt3: any, previousGPT: any, pubmed_id: number) {
  articlesBeingProcessed++

  if(previousGPT?.previousGPT?.previousGPT?.previousGPT){
    previousGPT.previousGPT.previousGPT.previousGPT = null
  }

  try{
    const gpt4: any = {
      status: null,
      questions: [],
      tokens: [],
      symptoms: {},
      requests: 0,
      costEstimation: 0,
      previousGPT,
    }
  
    if (!Object.keys(gpt3?.symptoms || {}).length) {
      return
    }

    const result = await getCompletion(
      true,
      text,
      `Does the study below used actual adult human beings? Answer 'no' if it is an in vitro study. Answer 'no' if the study used animals or cells. Answer 'no' if the study used kids. Give an answer only containing 'yes', 'no', or 'not defined'.`,
      gpt4
    )

    if (result.replace(/\W/g, '').includes('yes')) {
      gpt4.isHuman = true
    }
    else{
      gpt4.isHuman = false
      notHumanArticles++
    }

    for (let symptom in gpt3?.symptoms) {
      const treatments = _.uniq(
        (gpt3?.symptoms[symptom] || [])
          .filter((t: any) => t?.mainSymptomTreatment === true)
          .map((t: any) => t.treatment.trim().toLowerCase())
          .filter((t: any) => t.length)
      )
  
      for (let treatment of treatments) {
        if (treatment === 'date' || treatment === 'dates') {
          treatment = 'phoenix dactylifera'
        }
  
        if (treatment === '5-htp' || treatment === '5htp') {
          treatment = '5-hydroxytryptophan'
        }
  
        if (treatment === 'same') {
          treatment = 'S-adenosyl-L-methionine'
        }
  
        const treatmentVerb = treatmentsMaster[treatment as string] ?? ''
  
        const result = await getCompletion(
          true,
          text,
          `Does the study below indicate that ${treatmentVerb} ${treatment} improves ${symptom} in humans? Give an answer only containing 'yes', 'no', or 'not defined'.`,
          gpt4
        )
  
        if (result.replace(/\W/g, '').includes('yes')) {
          if (!gpt4.symptoms[symptom]) {
            gpt4.symptoms[symptom] = []
          }
  
          let mainSymptomTreatment = null
          let recommendedDosage = null
          let howMuch = null
          let keyRoles = null
  
          gpt4.symptoms[symptom].push({
            treatment,
            howMuch,
            keyRoles,
            mainSymptomTreatment,
            recommendedDosage,
          })
        }
      }
    }

    if (Object.keys(gpt4.symptoms).length === 0) {
      gpt4.status = 'rejected'
      gpt4.rejectionReason = 'No interventions found'
    } else {
      acceptCounter++
      gpt4.status = 'accepted'
    }
  
    gpt4.requests = gpt4.tokens.length
  
    await MedicineArticles.update(
      {
        gpt4,
      },
      {
        where: {
          pubmed_id,
        },
      }
    )

  }
  catch(e){
    console.log(e)
  }
  finally{
    articlesBeingProcessed--
    articlesProcessed++

    console.log(
      `GPT4: ${articlesProcessed}/${totalArticles} articles processed. ${articlesBeingProcessed} articles being processed. ${acceptCounter} accepted. ${notHumanArticles} not human articles. ${cachedGpt4RequestsCounter} cached requests. ${nonCachedGpt4RequestsCounter} non-cached requests. Last article processed ${pubmed_id}`
    )
  }
}

async function getCompletion(
  isShortAnswer: boolean,
  article: string,
  question: string,
  gpt4: any,
  retries: number = 0
): Promise<any> {
  //console.log(`QUESTION: ${question}`);

  if (!gpt4.tokens) {
    gpt4.tokens = []
  }

  if (!gpt4.questions) {
    gpt4.questions = []
  }

  const cachedAnswer = getCachedGpt4Answer(question, gpt4)

  if (cachedAnswer) {
    cachedGpt4RequestsCounter++
    gpt4.tokens.push(0)
    gpt4.questions.push({
      question,
      answer: cachedAnswer,
      cached: true,
    })

    return cachedAnswer
  }

  nonCachedGpt4RequestsCounter++

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

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4-1106-preview',
      messages,
      temperature: 0.7,
      max_tokens: isShortAnswer ? 3 : 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    gpt4.tokens.push(completion?.data?.usage?.total_tokens || 0)

    const result = (completion.data.choices[0].message?.content || '').trim().toLowerCase()

    gpt4.questions.push({
      question,
      answer: result,
      cached: false,
    })

    //console.log(`ANSWER: ${result}`);

    return result
  } catch (error: any) {
    console.log('ERROR-->>')
    console.log(error?.response?.data?.error)

    if (
      error?.response?.data?.error?.type === 'invalid_request_error' &&
      error?.response?.data?.error?.code === 'context_length_exceeded'
    ) {
      if (!openAiErrors['context_length_exceeded']) {
        openAiErrors['context_length_exceeded'] = 0
      }

      openAiErrors['context_length_exceeded']++

      return ''
    }

    if (
      error?.response?.data?.error?.type === 'server_error' &&
      (error?.response?.data?.error?.message ?? '').includes('overloaded')
    ) {
      if (!openAiErrors['overloaded']) {
        openAiErrors['overloaded'] = 0
      }

      openAiErrors['overloaded']++

      await wait(5000)
    } else {
      if (
        error?.response?.data?.error?.type === 'tokens' &&
        error?.response?.data?.error?.code === 'rate_limit_exceeded'
      ) {
        if (!openAiErrors['rate_limit_exceeded']) {
          openAiErrors['rate_limit_exceeded'] = 0
        }

        openAiErrors['rate_limit_exceeded']++

        await wait(5000)
      } else {
        const message = (error?.response?.data?.error?.message ?? '').substring(0, 115)

        if (!openAiErrors[message]) {
          openAiErrors[message] = 0
        }

        openAiErrors[message]++

        await wait(5000)
      }
    }

    console.log(openAiErrors)

    return await getCompletion(isShortAnswer, article, question, gpt4, retries + 1)
  }
}

function getCachedGpt4Answer(question: string, gpt4: any) {
  if (gpt4?.previousGPT?.questions?.length > 0) {
    const previousQuestion = gpt4.previousGPT.questions.find((q: any) => q.question === question)

    if (previousQuestion) {
      return previousQuestion.answer
    }
  }

  return null
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getArticles() {
  let articles =
    (await MedicineArticles.findAll({
      raw: true,
      attributes: ['id', 'pubmed_id', 'gpt'],
      limit: 500000,
      where: Sequelize.where(
        Sequelize.fn('JSON_EXTRACT', Sequelize.col('gpt'), Sequelize.literal(`'$.status'`)),
        '=',
        'accepted'
      ),
    })) || []

  console.log(`${articles?.length} accepted articles found`)

  for (const article of articles) {
    article.containsMainSymptomTreatment = false

    for (const symptom in article?.gpt?.symptoms ?? {}) {
      const treatments = (article.gpt.symptoms[symptom] ?? [])
        .filter((t: any) => t?.mainSymptomTreatment === true)
        .map((t: any) => t.treatment)
        .filter((t: any) => t.length)

      if (treatments.length) {
        article.containsMainSymptomTreatment = true
        break
      }
    }
  }

  const mainArticles = [
    ...articles
  ]

  console.log(`${mainArticles?.length} mainArticles found`)

  const fullMainArticles =
    (await MedicineArticles.findAll({
      raw: true,
      attributes: ['id', 'pubmed_id', 'short_text', 'gpt', 'gpt4'],
      where: {
        pubmed_id: mainArticles.map((a: any) => a.pubmed_id),
      },
    })) || []

  console.log(`${fullMainArticles?.length} fullMainArticles found`)

  for (const article of mainArticles) {
    const fullArticle = fullMainArticles.find((a: any) => +a.pubmed_id === +article.pubmed_id)

    article.short_text = fullArticle.short_text
    article.gpt = fullArticle.gpt
    article.gpt4 = fullArticle.gpt4
  }

  return mainArticles
}
