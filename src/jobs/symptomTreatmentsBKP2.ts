import config from '../config'
import CustomRecommendations from '../models/custom_recommendations'
import SymptomMaster from '../models/masters/symptom_master'
import TreatmentMaster from '../models/masters/treatment_master'
import MedicineArticles from '../models/medicine_articles'
import MedicineArticlesProcessed from '../models/medicine_articles_processed'
import MedicineArticlesProcessedOwn from '../models/medicine_articles_processed_own'
import SymptomTreatments from '../models/symptom_treatments'
import SymptomTreatmentsPdf from '../models/symptom_treatments_pdf'
const { Configuration, OpenAIApi } = require('openai')

export async function symptomTreatments() {
  if (config.NODE_ENV !== 'qa') {
    console.log('NOT QA ENV')
    return
  }

  console.log('symptomTreatments - QA ENV')

  // let symptomsTreatments: any[] = await getSymptomsTreatments()

  // await removeSymptomsTreatments(symptomsTreatments)

  // console.log('symptomsTreatments: ', symptomsTreatments?.length)

  // symptomsTreatments = await filterSymptomsTreatmentRequireUpdate(symptomsTreatments)

  // await sumarizeAndUpsert(symptomsTreatments)

  await populateGpt4()

  console.log('symptomsTreatments DONE')
}

async function populateGpt4(){
  const symptomTreatments =
  (await SymptomTreatments.findAll({
    raw: true,
  })) ?? []

  let count = 0
  let gpt4AcceptedCount = 0

  for(const symptomTreatment of symptomTreatments){
    count++

    console.log(`populateGpt4 ${count} of ${symptomTreatments.length}. gpt4AcceptedCount: ${gpt4AcceptedCount}`)

    const articles = symptomTreatment.articles

    for(const article of articles){
      const medicineArticle = await MedicineArticles.findOne({
        raw: true,
        where: {
          pubmed_id: article.articlePubmedId
        }
      })

     // console.log(`${!!medicineArticle} | ${article.articlePubmedId} | ${!!medicineArticle?.gpt4} | ${medicineArticle?.gpt4?.status}`);

      if(medicineArticle?.gpt4?.status === 'accepted'){        
        const gpt4Treatment = ((medicineArticle?.gpt4?.symptoms??{})[symptomTreatment.symptom_name]??[]).find((t: any) => t?.treatment?.toLowerCase().trim() === symptomTreatment.treatment_name?.toLowerCase().trim())

        if(gpt4Treatment){
          gpt4AcceptedCount++
          article.gpt4 = gpt4Treatment
        }
      }
    }

    await SymptomTreatments.update(symptomTreatment, {
      where: {
        id: symptomTreatment.id
      }
    })
  }
}

async function removeSymptomsTreatments(symptomsTreatments: any[]) {
  const symptomTreatmentsDB =
  (await SymptomTreatments.findAll({
    raw: true,
  })) ?? []

  const symptomTreatmentsToBeRemoved = symptomTreatmentsDB.filter((stDB: any) => !symptomsTreatments.find((st: any) => +st.symptom_id === +stDB.symptom_id && +st.treatment_id === +stDB.treatment_id))

  console.log('symptomTreatmentsToBeRemoved: ', symptomTreatmentsToBeRemoved?.length)

  for (const symptomTreatmentToBeRemoved of symptomTreatmentsToBeRemoved) {
    console.log(`Removing ${symptomTreatmentToBeRemoved.symptom_id} and ${symptomTreatmentToBeRemoved.treatment_id}`)

    await SymptomTreatments.destroy({
      where: {
        symptom_id: symptomTreatmentToBeRemoved.symptom_id,
        treatment_id: symptomTreatmentToBeRemoved.treatment_id,
      },
    })
  }
}

async function sumarizeAndUpsert(symptomsTreatments: any[]) {
  const total = symptomsTreatments.length
  let count = 0

  for (const symptomTreatment of symptomsTreatments) {
    count++
    console.log(`sumarizeAndUpsert ${count} of ${total}`)

    await summarize(symptomTreatment)

    await upsert(symptomTreatment)
  }
}

async function upsert(symptomTreatment: any) {
  if (symptomTreatment.operation === 'create') {
    await SymptomTreatments.create(symptomTreatment)
    console.log(`Symptom ${symptomTreatment?.symptom_id} and treatment ${symptomTreatment?.treatment_id} created`)
  } else {
    await SymptomTreatments.update(symptomTreatment, {
      where: {
        symptom_id: symptomTreatment.symptom_id,
        treatment_id: symptomTreatment.treatment_id,
      },
    })
    console.log(`Symptom ${symptomTreatment?.symptom_id} and treatment ${symptomTreatment?.treatment_id} updated`)
  }
}

async function summarize(symptomTreatment: any) {
  console.log(`Summarizing ${symptomTreatment.operation}`)

  if (!symptomTreatment.operation) {
    console.log('ERROR: symptomTreatment.operation is required')
    throw new Error('symptomTreatment.operation is required')
  }

  if (!['create', 'update_description', 'update_articles'].includes(symptomTreatment.operation)) {
    console.log('ERROR: symptomTreatment.operation is invalid')
    throw new Error('symptomTreatment.operation is invalid')
  }

  if (symptomTreatment.operation === 'create' || symptomTreatment.operation === 'update_description') {
    const treatmentDescription = symptomTreatment.treatment_description

    if (treatmentDescription) {
      try {
        const isAbout = await extractInformation(
          treatmentDescription,
          `Does the text below indicate that ${symptomTreatment.treatment_name} improves ${symptomTreatment.symptom_name}? Give an answer only containing 'yes', 'no', or 'not defined'.`
        )

        if (isAbout.replace(/\W/g, '').includes('yes')) {
          symptomTreatment.treatment_description_summary.keyRoles = await extractInformation(
            treatmentDescription,
            `Could you explain me the key ways in which ${symptomTreatment.treatment_name} helps to improve ${symptomTreatment.symptom_name} according to the text below?`
          )

          if (symptomTreatment.treatment_type !== 'lifestyle') {
            symptomTreatment.treatment_description_summary.dosage = await extractInformation(
              treatmentDescription,
              `What is the recommended dosage of ${symptomTreatment.treatment_name} to improve ${symptomTreatment.symptom_name}? according to the text below?`
            )
          }

          symptomTreatment.treatment_description_summary.expectedImprovement = await extractInformation(
            treatmentDescription,
            `What is the expected improvement in ${symptomTreatment.symptom_name} for a person utilizing ${symptomTreatment.treatment_name}, according to the text below?`
          )
        }
      } catch (e: any) {
        symptomTreatment.errors.push({ message: e?.message ?? '' })
        console.log(e)
      }
    }
  }

  let keyRoles = [symptomTreatment.treatment_description_summary.keyRoles ?? '']
  let dosage = [symptomTreatment.treatment_description_summary.dosage ?? '']
  let expectedImprovement = [symptomTreatment.treatment_description_summary.expectedImprovement ?? '']

  keyRoles.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.keyRolesExplanation || article?.treatment?.keyRoles))
  dosage.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.recommendedDosage))
  expectedImprovement.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.howMuch))

  keyRoles = keyRoles.filter((keyRole: any) => keyRole?.length)
  dosage = dosage.filter((dosage: any) => dosage?.length)
  expectedImprovement = expectedImprovement.filter((expectedImprovement: any) => expectedImprovement?.length)

  try {
    if (keyRoles.length) {
      symptomTreatment.key_roles =
        (await combineAndAsk(
          keyRoles,
          `Could you list the key ways in which ${symptomTreatment.treatment_name} helps to improve ${symptomTreatment.symptom_name} according to the text below? Respond in bullet points with short sentences and provide no more than four points. Each point should complete the sentence: '${symptomTreatment.treatment_name} plays a key role in:'`
        )) ?? null

      if (symptomTreatment.key_roles?.length && symptomTreatment.key_roles?.includes('\n')) {
        symptomTreatment.key_roles = symptomTreatment.key_roles
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
  } catch (e: any) {
    console.log(e)
    symptomTreatment.errors.push({ message: e?.message ?? '' })
  }

  if (symptomTreatment?.treatment_type?.toLowerCase() !== 'lifestyle' && dosage?.length) {
    try {
      symptomTreatment.dosage = await combineAndAsk(
        dosage,
        `According to the text below what is the most common recommended dosage of ${symptomTreatment.treatment_name} to improve ${symptomTreatment.symptom_name}? Respond only one dosage. If you find more than one recommended dosage, choose the smallest one. The answer should complete the sentence: 'the recommended dosage of ${symptomTreatment.treatment_name} to improve ${symptomTreatment.symptom_name} is '`
      )

      if (!(symptomTreatment.dosage ?? '').toLowerCase().includes('the recommended dosage of')) {
        symptomTreatment.dosage = `the recommended dosage of ${symptomTreatment.treatment_name} to improve ${symptomTreatment.symptom_name} is ${symptomTreatment.dosage}`
      }
    } catch (e: any) {
      symptomTreatment.errors.push({ message: e?.message ?? '' })
      console.log(e)
    }
  }

  if (expectedImprovement?.length) {
    try {
      symptomTreatment.expected_improvement = await combineAndAsk(
        expectedImprovement,
        `According to the study below what is the expected improvement in ${symptomTreatment.symptom_name} for a person utilizing ${symptomTreatment.treatment_name}? Respond in one short sentence using layman's terms.`
      )
    } catch (e: any) {
      symptomTreatment.errors.push({ message: e?.message ?? '' })
      console.log(e)
    }
  }
}

async function filterSymptomsTreatmentRequireUpdate(symptomsTreatments: any[]) {
  const symptomTreatmentsDB =
    (await SymptomTreatments.findAll({
      raw: true,
    })) ?? []

  let requireCreateCount = 0
  let requireUpdateArticlesCount = 0
  let requireUpdateDescriptionCount = 0

  const symptomsTreatmentsFiltered = symptomsTreatments.filter((symptomTreatment: any) => {
    const symptomTreatmentDB = symptomTreatmentsDB.find(
      (st: any) => st.symptom_id === symptomTreatment.symptom_id && st.treatment_id === symptomTreatment.treatment_id
    )

    if (!symptomTreatmentDB) {
      symptomTreatment.operation = 'create'
      requireCreateCount++
      return true
    }

    if (symptomTreatmentDB?.treatment_description !== symptomTreatment?.treatment_description) {
      symptomTreatment.operation = 'update_description'
      requireUpdateDescriptionCount++
      return true
    }

    if ((symptomTreatmentDB?.articles?.length !== symptomTreatment?.articles?.length) || (symptomTreatmentDB?.errors?.length)) {
      symptomTreatment.operation = 'update_articles'
      requireUpdateArticlesCount++
      return true
    }

    let articlesOwnDBPubmedId = (symptomTreatmentDB?.articles??[]).filter((article: any) => article?.isOwn === true).map((article: any) => +article.articlePubmedId)
    let articlesOwnPubmedId = (symptomTreatment?.articles??[]).filter((article: any) => article?.isOwn === true).map((article: any) => +article.articlePubmedId)

    articlesOwnDBPubmedId = articlesOwnDBPubmedId.sort((a: any, b: any) => a - b)
    articlesOwnPubmedId = articlesOwnPubmedId.sort((a: any, b: any) => a - b)

    if (JSON.stringify(articlesOwnDBPubmedId) !== JSON.stringify(articlesOwnPubmedId)) {
      symptomTreatment.operation = 'update_articles'
      requireUpdateArticlesCount++
      return true
    }

    let articlesDBPubmedId = (symptomTreatmentDB?.articles??[]).filter((article: any) => !article?.isOwn).map((article: any) => +article.articlePubmedId)
    let articlesPubmedId = (symptomTreatment?.articles??[]).filter((article: any) => !article?.isOwn).map((article: any) => +article.articlePubmedId)

    articlesDBPubmedId = articlesDBPubmedId.sort((a: any, b: any) => a - b)
    articlesPubmedId = articlesPubmedId.sort((a: any, b: any) => a - b)

    if (JSON.stringify(articlesDBPubmedId) !== JSON.stringify(articlesPubmedId)) {
      symptomTreatment.operation = 'update_articles'
      requireUpdateArticlesCount++
      return true
    }

    return false
  })

  console.log(`requireCreateCount: ${requireCreateCount}`)
  console.log(`requireUpdateArticlesCount: ${requireUpdateArticlesCount}`)
  console.log(`requireUpdateDescriptionCount: ${requireUpdateDescriptionCount}`)
  console.log(`symptomsTreatmentsFiltered: ${symptomsTreatmentsFiltered.length}`)

  return symptomsTreatmentsFiltered
}

async function getSymptomsTreatments() {
  const symptomsTreatments: any[] = []

  const symptoms = await SymptomMaster.findAll({ raw: true })
  const treatments = await TreatmentMaster.findAll({ raw: true })

  const customRecomendations = await CustomRecommendations.findAll({ raw: true })

  customRecomendations.forEach((customRecomendation: any) => {
    const symptom = symptoms.find((symptom: any) => symptom.symptom_id === customRecomendation.symptom_id)
    if (symptom) {
      ;(customRecomendation?.treatments ?? '')
        .split(';')
        .filter((id: string) => id?.length)
        .map((id: string) => Number(id))
        .forEach((treatmentId: number) => {
          const treatment = treatments.find((treatment: any) => +treatment.treatment_id === +treatmentId)

          if (treatment) {
            const symptomTreatment: any = getSymptomTreatmentObj(symptomsTreatments, symptom, treatment)

            symptomTreatment.custom_recommendations_id = customRecomendation.id
          } else {
            console.log(
              `customRecomendations treatment not found ${treatmentId} - symptom ${customRecomendation.symptom_id}`
            )
          }
        })
    } else {
      console.log('customRecomendations symptom not found', customRecomendation.symptom_id)
    }
  })

  console.log(`symptomsTreatments - custom recomendations ${symptomsTreatments.length} DONE`)

  const symptomTreatmentsPdf = await SymptomTreatmentsPdf.findAll({ raw: true })

  symptomTreatmentsPdf.forEach((symptomTreatmentPdf: any) => {
    const symptom = symptoms.find((symptom: any) => +symptom.symptom_id === +symptomTreatmentPdf.symptom_id)

    const dosage: any = {}
    const expectedImprovement: any = {}
    const keyRoles: any = {}

    symptomTreatmentPdf?.dosage ??
      ''.split('|').forEach((dosageItem: string) => {
        const [treatmentId, dosageStr] = dosageItem.split('-')
        dosage[+(treatmentId ?? '').trim()] = (dosageStr ?? '').trim()
      })

    symptomTreatmentPdf?.additional_information ??
      ''.split('|').forEach((infoItem: string) => {
        const [treatmentId, infoStr] = infoItem.split('-')
        expectedImprovement[+(treatmentId ?? '').trim()] = (infoStr ?? '').trim()
      })

    symptomTreatmentPdf?.key_roles ??
      ''.split('|').forEach((keyRolesItem: string) => {
        const [treatmentId, keyRolesStr] = keyRolesItem.split('-')
        keyRoles[+(treatmentId ?? '').trim()] = (keyRolesStr ?? '').trim()
      })

    if (symptom) {
      ;(symptomTreatmentPdf?.treatments_ids ?? '')
        .split(';')
        .filter((id: string) => id?.length)
        .map((id: string) => Number(id))
        .forEach((treatmentId: number) => {
          const treatment = treatments.find((treatment: any) => +treatment.treatment_id === +treatmentId)

          if (treatment) {
            const symptomTreatment = getSymptomTreatmentObj(symptomsTreatments, symptom, treatment)

            symptomTreatment.articles.push({
              articleId: -1,
              articleTitle: 'SYMPTOM_TREATMENT_PDF',
              articleUrl: 'SYMPTOM_TREATMENT_PDF',
              articlePubmedId: -1,
              treatment: {
                howMuch: expectedImprovement[treatmentId] ?? '',
                keyRoles: null,
                treatment: '',
                successRate: null,
                preconditions: [],
                recommendedDosage: dosage[treatmentId] ?? '',
                keyRolesExplanation: keyRoles[treatmentId] ?? '',
              },
            })

            symptomTreatment.symptom_treatments_pdf_id = symptomTreatmentPdf.id
          } else {
            console.log(
              `symptomTreatmentsPdf treatment not found ${treatmentId} - symptom ${symptomTreatmentPdf.symptom_id}`
            )
          }
        })
    } else {
      console.log('symptomTreatmentsPdf symptom not found', symptomTreatmentPdf.symptom_id)
    }
  })

  console.log(`symptomsTreatments - symptom treatments PDFs ${symptomsTreatments.length} DONE`)

  const articles = await MedicineArticlesProcessed.findAll({
    raw: true,
    where: {
      is_accepted: true,
    },
  })

  for (const article of articles) {
    for (const symptomArticleName in article?.gpt?.symptoms ?? {}) {
      for (const treatmentArticle of article?.gpt?.symptoms[symptomArticleName] ?? []) {
        if (treatmentArticle?.mainSymptomTreatment === true) {
          const symptom = symptoms.find(
            (symptom: any) =>
              (symptom.symptom_name ?? '').toLowerCase().trim() === (symptomArticleName ?? '').toLowerCase().trim()
          )
          if (symptom) {
            let treatment = treatments.find(
              (treatment: any) =>
                (treatment.treatment_name ?? '').toLowerCase().trim() ===
                (treatmentArticle?.treatment ?? '').toLowerCase().trim()
            )

            if (!treatment) {
              treatment = treatments.find((treatment: any) =>
                (treatment?.treatment_synonyms ?? '')
                  .split(';')
                  .map((s: string) => s.toLowerCase().trim())
                  .includes((treatmentArticle?.treatment ?? '').toLowerCase().trim())
              )
            }

            if (treatment) {
              const symptomTreatment = getSymptomTreatmentObj(symptomsTreatments, symptom, treatment)

              symptomTreatment.articles.push({
                articleId: article.id,
                articleTitle: article.title,
                articleUrl: article.url,
                articlePubmedId: article.pubmed_id,
                treatment: treatmentArticle,
              })
            } else {
              console.log(`articles treatment not found ${treatmentArticle?.treatment}`)
            }
          } else {
            console.log('articles symptom not found: ', symptomArticleName)
          }
        }
      }
    }
  }

  console.log(`symptomsTreatments - articles ${symptomsTreatments.length} DONE`)

  const articlesOwn = await MedicineArticlesProcessedOwn.findAll({
    raw: true,
    where: {
      is_accepted: true,
    },
  })

  for (const articleOwn of articlesOwn) {
    for (const symptomArticleOwnName in articleOwn?.gpt?.symptoms ?? {}) {
      for (const treatmentArticleOwn of articleOwn?.gpt?.symptoms[symptomArticleOwnName] ?? []) {
        const symptom = symptoms.find(
          (symptom: any) =>
            (symptom.symptom_name ?? '').toLowerCase().trim() === (symptomArticleOwnName ?? '').toLowerCase().trim()
        )

        if (symptom) {
          let treatment = treatments.find(
            (treatment: any) =>
              (treatment.treatment_name ?? '').toLowerCase().trim() ===
              (treatmentArticleOwn?.treatment ?? '').toLowerCase().trim()
          )

          if (!treatment) {
            treatment = treatments.find((treatment: any) =>
              (treatment?.treatment_synonyms ?? '')
                .split(';')
                .map((s: string) => s.toLowerCase().trim())
                .includes((treatmentArticleOwn?.treatment ?? '').toLowerCase().trim())
            )
          }

          if (treatment) {
            const symptomTreatment = getSymptomTreatmentObj(symptomsTreatments, symptom, treatment)

            symptomTreatment.articles.push({
              articleId: articleOwn.id,
              articleTitle: articleOwn.title,
              articleUrl: articleOwn.url,
              articlePubmedId: articleOwn.pubmed_id,
              treatment: treatmentArticleOwn,
              isOwn: true
            })
          } else {
            console.log(`articles OWN treatment not found ${treatmentArticleOwn?.treatment}`)
          }
        } else {
          console.log('articles OWN symptom not found: ', symptomArticleOwnName)
        }
      }
    }
  }

  console.log(`symptomsTreatments - articles OWN ${symptomsTreatments.length} DONE`)

  return symptomsTreatments
}

function getSymptomTreatmentObj(symptomsTreatments: any[], symptom: any, treatment: any) {
  let symptomTreatment: any = (symptomsTreatments ?? []).find(
    (symptomTreatment: any) =>
      symptomTreatment.symptom_id === symptom.symptom_id && symptomTreatment.treatment_id === treatment.treatment_id
  )

  if (symptomTreatment) {
    return symptomTreatment
  } else {
    symptomTreatment = {
      treatment_id: treatment.treatment_id,
      treatment_name: treatment.treatment_name,
      symptom_id: symptom.symptom_id,
      symptom_name: symptom.symptom_name,
      articles: [],
      symptom_foods_id: null,
      symptom_treatments_pdf_id: null,
      key_roles: null,
      dosage: null,
      expected_improvement: null,
      treatment_description_summary: {
        keyRoles: null,
        dosage: null,
        expectedImprovement: null,
      },
      errors: [],
      treatment_description: treatment.description,
      custom_recommendations_id: null,
      treatment_type: treatment.treatment_type,
    }

    symptomsTreatments.push(symptomTreatment)

    return symptomTreatment
  }
}

async function extractInformation(text: string, question: string, retries: number = 0): Promise<any> {
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
    ${text}
    """`,
    },
  ]

  const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
  })

  const openai = new OpenAIApi(configuration)

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const result = (completion.data.choices[0].message?.content || '').trim().toLowerCase()

    return result
  } catch (error: any) {
    console.log('ERROR-->>')
    console.log(error?.response?.data?.error)

    if (
      error?.response?.data?.error?.type === 'invalid_request_error' &&
      error?.response?.data?.error?.code === 'context_length_exceeded'
    ) {
      return extractInformationGPT16k(text, question)
    }

    await wait(30000)

    return await extractInformation(text, question, retries + 1)
  }
}

async function extractInformationGPT16k(text: string, question: string, retries: number = 0): Promise<any> {
  console.log('!!!!!!!!!!!!!!!!!!!!!! RUNNING extractInformationGPT16k    !!!!!!!!!!!!!!!!!!!!!!')

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
    ${text}
    """`,
    },
  ]

  const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
  })

  const openai = new OpenAIApi(configuration)

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-16k-0613',
      messages,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const result = (completion.data.choices[0].message?.content || '').trim().toLowerCase()

    return result
  } catch (error: any) {
    console.log('ERROR-->>')
    console.log(error?.response?.data?.error)

    if (
      error?.response?.data?.error?.type === 'invalid_request_error' &&
      error?.response?.data?.error?.code === 'context_length_exceeded'
    ) {
      throw new Error('length_exceeded')
    }

    await wait(30000)

    return await extractInformation(text, question, retries + 1)
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
        'You are an empathetic AI assistant, with a focus on analyzing health-related scientific articles. Your goal is to extract key information from these articles that could potentially help patients understand their symptoms and treatments better.',
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
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const result = (completion.data.choices[0].message?.content || '').trim().toLowerCase()

    return result
  } catch (error: any) {
    console.log('ERROR-->>')
    console.log(error?.response?.data?.error)

    if (
      error?.response?.data?.error?.type === 'invalid_request_error' &&
      error?.response?.data?.error?.code === 'context_length_exceeded'
    ) {
      return combineAndAsk16K(textList, question, 0)
    }

    await wait(30000)

    return await extractInformation(text, question, retries + 1)
  }
}

async function combineAndAsk16K(textList: string[], question: string, retries: number = 0): Promise<any> {
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
        'You are an empathetic AI assistant, with a focus on analyzing health-related scientific articles. Your goal is to extract key information from these articles that could potentially help patients understand their symptoms and treatments better.',
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
      model: 'gpt-3.5-turbo-16k-0613',
      messages,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const result = (completion.data.choices[0].message?.content || '').trim().toLowerCase()

    return result
  } catch (error: any) {
    console.log('ERROR-->>')
    console.log(error?.response?.data?.error)

    if (
      error?.response?.data?.error?.type === 'invalid_request_error' &&
      error?.response?.data?.error?.code === 'context_length_exceeded'
    ) {
      if(textList.length < 2) {
        throw new Error('length_exceeded')
      }
      
      return combineAndAsk16K(textList.slice(0,Math.round(textList.length*0.8)), question, 0)
    }

    await wait(30000)

    return await extractInformation(text, question, retries + 1)
  }
}