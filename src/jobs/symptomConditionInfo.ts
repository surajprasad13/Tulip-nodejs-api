import config from '../config'
import MessageCypress from '../models/message_cypress'
import SymptomConditionMaster from '../models/symptom_condition_master'
import { Op } from 'sequelize'
const { Configuration, OpenAIApi } = require('openai')

const folder =
  'https://app.humata.ai/ask/folder/e57e77da-9a7d-4424-a6fc-4bbac81a9954?share_link=1344d71c-3f50-4e9a-ac1e-23cfd544139c'

export async function symptomConditionInfo() {
  if (config.NODE_ENV !== 'qa') {
    console.log('NOT QA')
    return
  }

  console.log('symptomConditionInfo - QA ENV')

  // await clearNotAnsweredQuestions()

  // await extractInfoFromPDFs()

  // await extractInfoFromGPT()

  await summarizeInfo()
}
async function summarizeInfo() {
  const symptomsAndConditions = await SymptomConditionMaster.findAll({ raw: true })

  // Configure OpenAI API
  const openaiApiKey = config.OPENAI_API_KEY
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  })
  const gpt = new OpenAIApi(configuration)

  for (const symptomAndCondition of symptomsAndConditions) {
    if((symptomAndCondition.summarized_info ?? '').length){
      continue
    }
    
    const info = (symptomAndCondition.info ?? []).map((info: any) => info.text ?? '').join('\n\n')

    if ((info?.length ?? 0) <= 10) {
      continue
    }

    try {
      const messages = [
        {
          role: 'user',
          content: `Summarize the text below:
           """
           ${info}
           """
           `,
        },
      ]

      console.log(JSON.stringify(messages))

      const gptResponse = await gpt.createChatCompletion({
        model: 'gpt-4-0613',
        messages,
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      const result = (gptResponse.data.choices[0].message?.content || '').trim().toLowerCase()

      console.log('GPT result')
      console.log(result)

      if (result?.length) {
        await SymptomConditionMaster.update({ summarized_info: result }, { where: { id: symptomAndCondition.id } })
      }
    } catch (err) {
      console.error(err)
    }
  }
}
async function extractInfoFromGPT() {
  const symptomsAndConditions = await SymptomConditionMaster.findAll({ raw: true })

  // Configure OpenAI API
  const openaiApiKey = config.OPENAI_API_KEY
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  })
  const gpt = new OpenAIApi(configuration)

  for (const symptomAndCondition of symptomsAndConditions) {
    if ((symptomAndCondition.info ?? []).find((info: any) => info?.source === 'gpt')) {
      continue
    }

    try {
      const messages = [
        {
          role: 'user',
          content: `Explain me the actual symptoms of ${symptomAndCondition.symptom_name}. What exactly does a person feel when they have ${symptomAndCondition.symptom_name}?`,
        },
      ]

      const gptResponse = await gpt.createChatCompletion({
        model: 'gpt-4-0613',
        messages,
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      const result = (gptResponse.data.choices[0].message?.content || '').trim().toLowerCase()

      console.log('GPT result')
      console.log(result)

      if (result?.length) {
        if (!symptomAndCondition?.info?.length) {
          symptomAndCondition.info = []
        }

        symptomAndCondition.info.push({
          source: 'gpt',
          folder,
          text: result,
        })

        await SymptomConditionMaster.update(
          { info: symptomAndCondition.info },
          { where: { id: symptomAndCondition.id } }
        )
      }
    } catch (err) {
      console.error(err)
    }
  }
}

async function extractInfoFromPDFs() {
  const symptomsAndConditions = await SymptomConditionMaster.findAll({ raw: true })

  //let processId = new Date().getTime()

  let processId = 1692993607088

  // for (const symptomAndCondition of symptomsAndConditions) {
  //   if ((symptomAndCondition.info ?? []).find((info: any) => info?.source === 'humata')) {
  //     continue
  //   }

  //   let question = `Explain me the actual symptoms of ${symptomAndCondition.symptom_name}. What exactly does a person feel when they have ${symptomAndCondition.symptom_name}?`

  //   let aux_data = {
  //     type: symptomAndCondition.symptom_name,
  //     data: null,
  //   }

  //   await sendQuestion(question, aux_data, processId)
  // }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  const cypressAnswers = await MessageCypress.findAll({ where: { processId }, raw: true })

  console.log(`Received ${cypressAnswers.length} answers`);
  
  for (const symptomAndCondition of symptomsAndConditions) {
    if ((symptomAndCondition.info ?? []).find((info: any) => info?.source === 'humata')) {
      continue
    }

    if(!cypressAnswers.find((a: any) => a.aux_data.type === symptomAndCondition.symptom_name)){
      console.log(`No answer for ${symptomAndCondition.symptom_name}`);
    }
    const answer = (cypressAnswers.find((a: any) => a.aux_data.type === symptomAndCondition.symptom_name).answer ?? '')
      .replace(/{.*}/g, '')
      .trim()
      .replace(/\n/g, ',')
      .toLowerCase()

    if (answer.length) {
      if (!symptomAndCondition?.info?.length) {
        symptomAndCondition.info = []
      }

      symptomAndCondition.info.push({
        source: 'humata',
        folder,
        text: answer,
      })

      await SymptomConditionMaster.update({ info: symptomAndCondition.info }, { where: { id: symptomAndCondition.id } })
    }
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sendQuestion(question: string, aux_data: any, processId: number) {
  let cached = false
  let cachedFrom = null
  let answer = null

  const cachedMessage = await MessageCypress.findOne({
    where: { question, folder, answer: { [Op.ne]: null } },
    raw: true,
  })

  if (cachedMessage) {
    cached = true
    cachedFrom = cachedMessage.id
    answer = cachedMessage.answer
  }

  await MessageCypress.create({
    question,
    folder,
    processId,
    answer,
    aux_data: {
      ...aux_data,
      cached,
      cachedFrom,
    },
  })
}

async function clearNotAnsweredQuestions() {
  const notAnswered = await MessageCypress.findAll({ where: { answer: { [Op.eq]: null } }, raw: true })

  console.log(`Deleting ${notAnswered.length} not answered questions...`)

  for (const question of notAnswered) {
    await MessageCypress.destroy({ where: { id: question.id } })
  }
}
