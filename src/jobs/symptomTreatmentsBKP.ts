import config from '../config'
import SymptomMaster from '../models/masters/symptom_master'
import TreatmentMaster from '../models/masters/treatment_master'
import SymptomFoods from '../models/symptom_foods'
import SymptomTreatments from '../models/symptom_treatments'
import SymptomTreatmentsPdf from '../models/symptom_treatments_pdf'
import MedicineArticlesProcessed from '../models/medicine_articles_processed'
const { Configuration, OpenAIApi } = require('openai')
import { Op, Sequelize } from 'sequelize'

export async function symptomTreatments() {
  if (
    config.NODE_ENV !== 'qa'
  ) {
    console.log('NOT QA ENV');
    return
  }

  console.log('symptomTreatments - QA ENV')

  let symptomsTreatments: any[] = await getSymptomsTreatments()

  symptomsTreatments = await filterSymptomsTreatmentsToBeProcessed(symptomsTreatments)

  await summarize(symptomsTreatments)
}

async function summarize(symptomsTreatments: any[]) {
  const total = symptomsTreatments.length
  let count = 0

  for (const symptomTreatment of symptomsTreatments) {
    count++
    console.log(`Summarizing ${count} of ${total}`)

    const treatmentDescription = symptomTreatment.treatmentDescription

    try {
      const isAbout = await extractInformation(
        treatmentDescription,
        `Does the text below indicate that ${symptomTreatment.treatmentName} improves ${symptomTreatment.symptomName}? Give an answer only containing 'yes', 'no', or 'not defined'.`
      )

      if (isAbout.replace(/\W/g, '').includes('yes')) {
        symptomTreatment.treatmentDescriptionSummary.keyRoles = await extractInformation(
          treatmentDescription,
          `Could you explain me the key ways in which ${symptomTreatment.treatmentName} helps to improve ${symptomTreatment.symptomName} according to the text below?`
        )

        if (symptomTreatment?.treatmentType?.toLowerCase() !== 'lifestyle') {
          symptomTreatment.treatmentDescriptionSummary.dosage = await extractInformation(
            treatmentDescription,
            `What is the recommended dosage of ${symptomTreatment.treatmentName} to improve ${symptomTreatment.symptomName}? according to the text below?`
          )
        }

        symptomTreatment.treatmentDescriptionSummary.expectedImprovement = await extractInformation(
          treatmentDescription,
          `What is the expected improvement in ${symptomTreatment.symptomName} for a person utilizing ${symptomTreatment.treatmentName}, according to the text below?`
        )
      }
    } catch (e: any) {
      symptomTreatment.errors.push({message: e?.message??''})
      console.log(e)
    }

    let keyRoles = [symptomTreatment.treatmentDescriptionSummary.keyRoles ?? '']
    let dosage = [symptomTreatment.treatmentDescriptionSummary.dosage ?? '']
    let expectedImprovement = [symptomTreatment.treatmentDescriptionSummary.expectedImprovement ?? '']

    keyRoles.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.keyRolesExplanation))
    dosage.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.recommendedDosage))
    expectedImprovement.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.howMuch))

    keyRoles = keyRoles.filter((keyRole: any) => keyRole?.length)
    dosage = dosage.filter((dosage: any) => dosage?.length)
    expectedImprovement = expectedImprovement.filter((expectedImprovement: any) => expectedImprovement?.length)

    try {
      if (keyRoles.length) {
        symptomTreatment.keyRoles =
          (await combineAndAsk(
            keyRoles,
            `Could you list the key ways in which ${symptomTreatment.treatmentName} helps to improve ${symptomTreatment.symptomName} according to the text below? Respond in bullet points with short sentences and provide no more than four points. Each point should complete the sentence: '${symptomTreatment.treatmentName} plays a key role in:'`
          )) ?? null

        if (symptomTreatment.keyRoles?.length && symptomTreatment.keyRoles?.includes('\n')) {
          symptomTreatment.keyRoles = symptomTreatment.keyRoles
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
    } catch (e:any) {
      console.log(e)
      symptomTreatment.errors.push({message: e?.message??''})
    }

    if (symptomTreatment?.treatmentType?.toLowerCase() !== 'lifestyle' && dosage?.length) {
      try {
        symptomTreatment.dosage = await combineAndAsk(
          dosage,
          `According to the text below what is the most common recommended dosage of ${symptomTreatment.treatmentName} to improve ${symptomTreatment.symptomName}? Respond only one dosage. If you find more than one recommended dosage, choose the smallest one. The answer should complete the sentence: 'the recommended dosage of ${symptomTreatment.treatmentName} to improve ${symptomTreatment.symptomName} is '`
        )

        if (!(symptomTreatment.dosage ?? '').toLowerCase().includes('the recommended dosage of')) {
          symptomTreatment.dosage = `the recommended dosage of ${symptomTreatment.treatmentName} to improve ${symptomTreatment.symptomName} is ${symptomTreatment.dosage}`
        }
      } catch (e:any) {
        symptomTreatment.errors.push({message: e?.message??''})
        console.log(e)
      }
    }

    if (expectedImprovement?.length) {
      try {
        symptomTreatment.expectedImprovement = await combineAndAsk(
          expectedImprovement,
          `According to the study below what is the expected improvement in ${symptomTreatment.symptomName} for a person utilizing ${symptomTreatment.treatmentName}? Respond in one short sentence using layman's terms.`
        )
      } catch (e:any) {
        symptomTreatment.errors.push({message: e?.message??''})
        console.log(e)
      }
    }

    await upsertSymptomsTreatments(symptomTreatment)
  }
}
async function filterSymptomsTreatmentsToBeProcessed(symptomsTreatments: any[]) {
  console.log('filterSymptomsTreatmentsToBeProcessed - ', symptomsTreatments.length);
  
  const symptomsTreatmentsDB = ((await SymptomTreatments.findAll({
    raw: true,
    where: {
      where: Sequelize.where(Sequelize.fn('JSON_LENGTH', Sequelize.col('articles')), '=', 0)
    }}))??[])
    .filter((st:any) => st?.key_roles?.length || st?.dosage?.length || st?.expected_improvement?.length)


  console.log('symptomsTreatmentsDB - ', symptomsTreatmentsDB.length);
  
  const symptomsTreatmentsOut = symptomsTreatments.filter((st:any) => symptomsTreatmentsDB.findIndex((stDB:any) => +stDB.symptom_id === +st.symptomId && +stDB.treatment_id === +st.treatmentId) >= 0)

  console.log('symptomsTreatmentsOut - ', symptomsTreatmentsOut.length);

  return symptomsTreatmentsOut
}


async function getSymptomsTreatments() {
  const symptomsTreatments: any[] = []

  const symptoms = await SymptomMaster.findAll({ raw: true })
  const treatments = await TreatmentMaster.findAll({ raw: true })

  const symptomFoods = await SymptomFoods.findAll({ raw: true })

  symptomFoods.forEach((symptomFood: any) => {
    const symptom = symptoms.find((symptom: any) => symptom.symptom_id === symptomFood.symptom_id)
    if (symptom) {
      ;(symptomFood?.foods ?? '')
        .split(';')
        .filter((id: string) => id?.length)
        .map((id: string) => Number(id))
        .forEach((foodId: number) => {
          const treatment = treatments.find((treatment: any) => treatment.treatment_id === foodId)

          if (treatment) {
            const symptomTreatment: any = getSymptomTreatmentObj(symptomsTreatments, symptom, treatment)

            symptomTreatment.symptomFoodsId = symptomFood.id
          }
        })
    }
  })

  const symptomTreatmentsPdf = await SymptomTreatmentsPdf.findAll({ raw: true })

  symptomTreatmentsPdf.forEach((symptomTreatmentPdf: any) => {
    const symptom = symptoms.find((symptom: any) => symptom.symptom_id === symptomTreatmentPdf.symptom_id)
    if (symptom) {
      ;(symptomTreatmentPdf?.treatments_ids ?? '')
        .split(';')
        .filter((id: string) => id?.length)
        .map((id: string) => Number(id))
        .forEach((treatmentId: number) => {
          const treatment = treatments.find((treatment: any) => treatment.treatment_id === treatmentId)

          if (treatment) {
            const symptomTreatment = getSymptomTreatmentObj(symptomsTreatments, symptom, treatment)

            symptomTreatment.symptomTreatmentsPdfId = symptomTreatmentPdf.id
          }
        })
    }
  })

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
          const symptom = symptoms.find((symptom: any) => symptom.symptom_name === symptomArticleName)
          if (symptom) {
            const treatment = treatments.find(
              (treatment: any) => treatment.treatment_name === treatmentArticle?.treatment
            )

            if (treatment) {
              const symptomTreatment = getSymptomTreatmentObj(symptomsTreatments, symptom, treatment)

              symptomTreatment.articles.push({
                articleId: article.id,
                articleTitle: article.title,
                articleUrl: article.url,
                articlePubmedId: article.pubmed_id,
                treatment: treatmentArticle,
              })
            }
          }
        }
      }
    }
  }

  return symptomsTreatments
}

function getSymptomTreatmentObj(symptomsTreatments: any[], symptom: any, treatment: any) {
  let symptomTreatment: any = (symptomsTreatments ?? []).find(
    (symptomTreatment: any) =>
      symptomTreatment.symptomId === symptom.symptom_id && symptomTreatment.treatmentId === treatment.treatment_id
  )

  if (symptomTreatment) {
    return symptomTreatment
  } else {
    symptomTreatment = {
      symptomId: symptom.symptom_id,
      treatmentId: treatment.treatment_id,
      symptomName: symptom.symptom_name,
      treatmentName: treatment.treatment_name,
      treatmentDescription: treatment.description,
      treatmentType: treatment.treatment_type,
      articles: [],
      symptomFoodsId: null,
      symptomTreatmentsPdfId: null,
      keyRoles: null,
      dosage: null,
      expectedImprovement: null,
      treatmentDescriptionSummary: {
        keyRoles: null,
        dosage: null,
        expectedImprovement: null,
      },
      errors: []
    }

    symptomsTreatments.push(symptomTreatment)

    return symptomTreatment
  }
}

async function upsertSymptomsTreatments(symptomTreatment: any) {
  const symptomTreatmentFromDB = await SymptomTreatments.findOne({
    raw: true,
    where: {
      treatment_id: symptomTreatment.treatmentId,
      symptom_id: symptomTreatment.symptomId,
    },
  })

  if (symptomTreatmentFromDB) {
    await SymptomTreatments.update(
      {
        symptom_name: symptomTreatment.symptomName,
        treatment_name: symptomTreatment.treatmentName,
        articles: symptomTreatment.articles,
        symptom_foods_id: symptomTreatment.symptomFoodsId,
        symptom_treatments_pdf_id: symptomTreatment.symptomTreatmentsPdfId,
        key_roles: symptomTreatment.keyRoles,
        dosage: symptomTreatment.dosage,
        expected_improvement: symptomTreatment.expectedImprovement,
        treatment_description_summary: symptomTreatment.treatmentDescriptionSummary,
        errors: symptomTreatment.errors
      },
      {
        where: {
          id: symptomTreatmentFromDB.id,
        },
      }
    )
  } else {
    await SymptomTreatments.create({
      symptom_id: symptomTreatment.symptomId,
      symptom_name: symptomTreatment.symptomName,
      treatment_id: symptomTreatment.treatmentId,
      treatment_name: symptomTreatment.treatmentName,
      articles: symptomTreatment.articles,
      symptom_foods_id: symptomTreatment.symptomFoodsId,
      symptom_treatments_pdf_id: symptomTreatment.symptomTreatmentsPdfId,
      key_roles: symptomTreatment.keyRoles,
      dosage: symptomTreatment.dosage,
      expected_improvement: symptomTreatment.expectedImprovement,
      treatment_description_summary: symptomTreatment.treatmentDescriptionSummary,
      errors: symptomTreatment.errors
    })
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
  console.log('!!!!!!!!!!!!!!!!!!!!!! RUNNING extractInformationGPT16k    !!!!!!!!!!!!!!!!!!!!!!');
  
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
      throw new Error('length_exceeded')
    }

    await wait(30000)

    return await extractInformation(text, question, retries + 1)
  }
}
