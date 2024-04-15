import config from '../config'
import SymptomMaster from '../models/masters/symptom_master'
import TreatmentMaster from '../models/masters/treatment_master'
import SymptomFoods from '../models/symptom_foods'
import SymptomTreatments from '../models/symptom_treatments'
import SymptomTreatmentsPdf from '../models/symptom_treatments_pdf'
import MedicineArticlesProcessed from '../models/medicine_articles_processed'
const { Configuration, OpenAIApi } = require('openai')
import { Op, Sequelize } from 'sequelize'
import MedicineArticlesProcessedOwn from '../models/medicine_articles_processed_own'

export async function symptomTreatmentsOwn2() {
  if (
    config.NODE_ENV !== 'qa'
  ) {
    console.log('NOT QA ENV');
    return
  }

  console.log('symptomTreatmentsOwn2 - QA ENV')

  const symptomTreatments = (await SymptomTreatments.findAll({
    raw: true,    
  })??[]).filter((st:any)=>(st?.articles??[]).filter((a: any) => a?.isOwn === true).length)

  console.log('symptomTreatmentsOwn2 - symptomTreatments.length: ', symptomTreatments.length);
  
  await summarize(symptomTreatments)

  console.log('symptomTreatmentsOwn2 - DONE');
}

async function summarize(symptomsTreatments: any[]) {
  const total = symptomsTreatments.length
  let count = 0

  const treatments = await TreatmentMaster.findAll({ raw: true })

  for (const symptomTreatment of symptomsTreatments) {
    count++
    console.log(`Summarizing ${count} of ${total} - ${symptomTreatment?.id}`)

    const treatment = treatments.find((treatment: any) => +treatment.treatment_id === +symptomTreatment.treatment_id)

    if(!treatment){
      console.log('TREATMENT NOT FOUND: ', symptomTreatment.treatment_id);
      continue
    }

    const treatmentDescription = treatment?.description ?? ''
    const treatmentType = treatment?.treatment_type ?? ''

    let treatmentDescriptionKeyRoles = ''
    let treatmentDescriptionDosage = ''
    let treatmentDescriptionExpectedImprovement = ''

    if(treatmentDescription?.length > 10){
      try {
        const isAbout = await extractInformation(
          treatmentDescription,
          `Does the text below indicate that ${symptomTreatment.treatment_name} improves ${symptomTreatment.symptom_name}? Give an answer only containing 'yes', 'no', or 'not defined'.`
        )
  
        if (isAbout.replace(/\W/g, '').includes('yes')) {
          treatmentDescriptionKeyRoles = await extractInformation(
            treatmentDescription,
            `Could you explain me the key ways in which ${symptomTreatment.treatment_name} helps to improve ${symptomTreatment.symptom_name} according to the text below?`
          )
  
          if (treatmentType !== 'lifestyle') {
            treatmentDescriptionDosage = await extractInformation(
              treatmentDescription,
              `What is the recommended dosage of ${symptomTreatment.treatment_name} to improve ${symptomTreatment.symptom_name}? according to the text below?`
            )
          }
  
          treatmentDescriptionExpectedImprovement = await extractInformation(
            treatmentDescription,
            `What is the expected improvement in ${symptomTreatment.symptom_name} for a person utilizing ${symptomTreatment.treatment_name}, according to the text below?`
          )
        }
      } catch (e: any) {
        symptomTreatment.errors.push({message: e?.message??''})
        console.log(e)
      }
    }
    else{
      console.log(`NOT FOUND TREATMENT DESCRIPTION - ${symptomTreatment.treatment_id}`);
    }


    let keyRoles = [treatmentDescriptionKeyRoles ?? '']
    let dosage = [treatmentDescriptionDosage ?? '']
    let expectedImprovement = [treatmentDescriptionExpectedImprovement ?? '']

    keyRoles.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.keyRolesExplanation))
    dosage.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.recommendedDosage))
    expectedImprovement.push(...(symptomTreatment?.articles ?? []).map((article: any) => article?.treatment?.howMuch))

    keyRoles = keyRoles.filter((keyRole: any) => keyRole?.length)
    dosage = dosage.filter((dosage: any) => dosage?.length)
    expectedImprovement = expectedImprovement.filter((expectedImprovement: any) => expectedImprovement?.length)


    console.log(`keyRoles: ${keyRoles?.length} - dosage: ${dosage?.length} - expectedImprovement: ${expectedImprovement?.length}`);

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
    } catch (e:any) {
      console.log(e)
      symptomTreatment.errors.push({message: e?.message??''})
    }

    if (treatmentType?.toLowerCase() !== 'lifestyle' && dosage?.length) {
      try {
        symptomTreatment.dosage = await combineAndAsk(
          dosage,
          `According to the text below what is the most common recommended dosage of ${symptomTreatment.treatment_name} to improve ${symptomTreatment.symptom_name}? Respond only one dosage. If you find more than one recommended dosage, choose the smallest one. The answer should complete the sentence: 'the recommended dosage of ${symptomTreatment.treatment_name} to improve ${symptomTreatment.symptom_name} is '`
        )

        if (!(symptomTreatment.dosage ?? '').toLowerCase().includes('the recommended dosage of')) {
          symptomTreatment.dosage = `the recommended dosage of ${symptomTreatment.treatment_name} to improve ${symptomTreatment.symptom_name} is ${symptomTreatment.dosage}`
        }
      } catch (e:any) {
        symptomTreatment.errors.push({message: e?.message??''})
        console.log(e)
      }
    }

    if (expectedImprovement?.length) {
      try {
        symptomTreatment.expected_improvement = await combineAndAsk(
          expectedImprovement,
          `According to the study below what is the expected improvement in ${symptomTreatment.symptom_name} for a person utilizing ${symptomTreatment.treatment_name}? Respond in one short sentence using layman's terms.`
        )
      } catch (e:any) {
        symptomTreatment.errors.push({message: e?.message??''})
        console.log(e)
      }
    }

    await SymptomTreatments.update(
      symptomTreatment,
      {
        where: {
          id: symptomTreatment.id,
        },
      }
    )
  }
}

async function extractInformation(text: string, question: string, retries: number = 0): Promise<any> {

  // console.log('extractInformation');
  // console.log(question);
  // console.log(text);
  
  
  
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

    //console.log('RESULT: ', result);
    

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
  // console.log('combineAndAsk');
  // console.log(question);
  // console.log(textList);
  
  
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

   // console.log('RESULT: ', result);

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
