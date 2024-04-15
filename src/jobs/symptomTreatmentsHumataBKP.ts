import config from '../config'
import MessageCypress from '../models/message_cypress'
import SymptomConditionMaster from '../models/symptom_condition_master'
import axios from 'axios'

const folder =
  'https://app.humata.ai/ask/folder/e57e77da-9a7d-4424-a6fc-4bbac81a9954?share_link=1344d71c-3f50-4e9a-ac1e-23cfd544139c'

export async function symptomTreatmentsHumata() {
  if (config.NODE_ENV !== 'qa') {
    console.log('NOT QA ENV')
    return
  }

  console.log('QA ENV - running symptomTreatmentsHumata')

  const symptoms = await getSymptoms()
  const conditions = await getConditions()

  console.log('conditions')
  console.log(conditions.map((c: any) => c.symptom_name))

  console.log('symptoms')
  console.log(symptoms.map((s: any) => s.symptom_name))

  let approvedConditions = await askCondition(conditions)

  approvedConditions = await getSymptomsPerCondition(approvedConditions, symptoms)

  console.log('approvedConditions')
  console.log(JSON.stringify(approvedConditions));
}

async function getSymptomsPerCondition(approvedConditions: any[], symptoms: any) {
  const symptomsChunks = createChunks(symptoms, 8)

  for (const approvedCondition of approvedConditions) {
    approvedCondition.symptoms = []

    for (const symptomChunk of symptomsChunks) {
      if (symptomChunk?.length > 1) {
        if (
          await checkCachedSplitedQuestions(
            symptomChunk.map(
              (symptom: any) =>
                `According to the text is ${symptom.symptom_name} a symptom of ${approvedCondition.symptom_name}? Answer only yes or no`
            )
          )
        ) {
          console.log('Cached chunk question')
          symptomsChunks.push(...symptomChunk.map((symptom: any) => [symptom]))
          continue
        }
      }

      const question =
        symptomChunk?.length > 1
          ? symptomChunk
              .map(
                (symptom: any, idx: number) =>
                  `${idx + 1} According to the text is ${symptom.symptom_name} a symptom of ${
                    approvedCondition.symptom_name
                  }? Answer only yes or no`
              )
              .join(' ')
          : `According to the text is ${symptomChunk[0].symptom_name} a symptom of ${approvedCondition.symptom_name}? Answer only yes or no`

      try {
        let answer = await askHumata(question, symptomChunk?.length === 1)

        if (!answer) {
          throw new Error('Error in getting answer')
        }

        answer = answer.replace(/{.*}/g, '').trim().replace(/\n/g, ',').toLowerCase()

        const answers = answer.match(/((no)|(yes))/g)

        console.log(`answers: ${answers}`)

        if (symptomChunk.length > 1) {
          if (answers?.length !== symptomChunk.length) {
            throw new Error(`answers?.length !== symptomChunk.length  | ${answers?.length} | ${symptomChunk.length}`)
          } else {
            symptomChunk.forEach((symptom: any, idx: number) => {
              if (answers[idx] === 'yes') {
                approvedCondition.symptoms.push(symptom)
              }
            })
          }
        } else {
          if (answer.startsWith('yes')) {
            approvedCondition.symptoms.push(symptomChunk[0])
          }
        }
      } catch (err) {
        console.log(err)

        if (symptomChunk?.length > 1) {
          console.log('Error - splitting questions')
          symptomsChunks.push(...symptomChunk.map((s: any) => [s]))
        } else {
          console.log('Error - skipping question')
        }
      }
    }
  }

  return approvedConditions
}

async function askCondition(conditions: any[]) {
  const conditionsChunks = createChunks(conditions, 4).slice(0, 12)

  const conditionAnswers: any = {}

  for (const conditionChunk of conditionsChunks) {
    if (conditionChunk?.length > 1) {
      if (
        await checkCachedSplitedQuestions(
          conditionChunk.map(
            (condition: any) => `Does the text mention anything about ${condition.symptom_name}? Answer only yes or no`
          )
        )
      ) {
        console.log('Cached chunk question')
        conditionsChunks.push(...conditionChunk.map((condition: any) => [condition]))
        continue
      }
    }

    const question =
      conditionChunk?.length > 1
        ? conditionChunk
            .map(
              (condition: any, idx: number) =>
                `${idx + 1} Does the text mention anything about ${condition.symptom_name}? Answer only yes or no`
            )
            .join(' ')
        : `Does the text mention anything about ${conditionChunk[0].symptom_name}? Answer only yes or no`

    try {
      let answer = await askHumata(question, conditionChunk?.length === 1)

      if (!answer) {
        throw new Error('Error in getting answer')
      }

      answer = answer.replace(/{.*}/g, '').trim().replace(/\n/g, ',').toLowerCase()

      const answers = answer.match(/((no)|(yes))/g)

      console.log(`answers: ${answers}`)

      if (conditionChunk.length > 1) {
        if (answers?.length !== conditionChunk.length) {
          throw new Error(`answers?.length !== conditionChunk.length  | ${answers?.length} | ${conditionChunk.length}`)
        } else {
          conditionChunk.forEach((condition: any, idx: number) => {
            conditionAnswers[condition.symptom_id] = answers[idx] === 'yes'
          })
        }
      } else {
        conditionAnswers[conditionChunk[0].symptom_id] = null

        if (answer.startsWith('yes')) {
          conditionAnswers[conditionChunk[0].symptom_id] = 'yes'
        }

        if (answer.startsWith('no')) {
          conditionAnswers[conditionChunk[0].symptom_id] = 'no'
        }
      }
    } catch (err) {
      console.log(err)

      if (conditionChunk?.length > 1) {
        console.log('Error - splitting questions')
        conditionsChunks.push(...conditionChunk.map((condition: any) => [condition]))
      } else {
        console.log('Error - skipping question')
      }
    }
  }

  console.log('conditionAnswers')
  console.log(conditionAnswers)

  const approvedConditionsIds = Object.keys(conditionAnswers)
    .filter((conditionId: any) => conditionAnswers[conditionId] === 'yes')
    .map((conditionId: any) => parseInt(conditionId))

  console.log('approvedConditionsIds')
  console.log(approvedConditionsIds)

  const approvedConditions = conditions.filter((condition: any) =>
    approvedConditionsIds.includes(+condition.symptom_id)
  )

  console.log('approvedConditions')
  console.log(approvedConditions)

  return approvedConditions
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function checkCachedSplitedQuestions(questions: string[]) {
  console.log('checkCachedSplitedQuestions')
  console.log(questions)

  const isCachedQuestions = questions.map((question: string) => ({
    question,
    isCached: false,
  }))

  for (const isCachedQuestion of isCachedQuestions) {
    const cachedAnswer =
      (
        ((await MessageCypress.findAll({
          raw: true,
          where: {
            question: isCachedQuestion.question,
            folder,
          },
          order: [['id', 'DESC']],
        })) || [])[0] || null
      )?.answer || null

    if (cachedAnswer) {
      isCachedQuestion.isCached = true
    }
  }

  console.log('CACHED QUESTIONS')
  console.log(isCachedQuestions.filter((isCachedQuestion: any) => isCachedQuestion.isCached === true))

  console.log('NOT CACHED QUESTIONS')
  console.log(isCachedQuestions.filter((isCachedQuestion: any) => isCachedQuestion.isCached === false))

  return !isCachedQuestions.filter((isCachedQuestion: any) => isCachedQuestion.isCached === false).length
}

async function askHumata(question: string, multipleTries: boolean, retries: number = 0): Promise<any> {
  try {
    console.log(`askHumata question: ${question}`)

    let cachedAnswer =
      (
        ((await MessageCypress.findAll({
          raw: true,
          where: {
            question,
            folder,
          },
          order: [['id', 'DESC']],
        })) || [])[0] || null
      )?.answer || null

    if (cachedAnswer) {
      console.log(`askHumata cachedAnswer: ${cachedAnswer}`)

      return cachedAnswer
    }

    const message_id = new Date().getTime()

    const result = await axios.post('https://tulip-dev-cypresspdf-spec-93sdv.ondigitalocean.app/runTests', {
      message_id,
      folder,
      question,
    })

    if (result?.status !== 200) {
      throw new Error('Error in asking condition')
    }

    console.log(`askHumata result: ${result.data}`)

    let answer =
      (
        ((await MessageCypress.findAll({
          raw: true,
          where: {
            messageId: message_id,
          },
          order: [['id', 'DESC']],
        })) || [])[0] || null
      )?.answer || null

    console.log(`askHumata answer: ${question}`)

    return answer
  } catch (err) {
    if (multipleTries && retries < 30) {
      console.log('ASK HUMATA ERROR - RETRYING ', retries)

      await wait(120000)
      return await askHumata(question, multipleTries, retries + 1)
    } else {
      throw new Error(`ASK HUMATA ERROR | ${multipleTries} | ${retries}`)
    }
  }
}

function createChunks(array: any, chunkSize: number) {
  const chunks = []
  let i = 0
  const n = array.length
  while (i < n) {
    chunks.push(array.slice(i, (i += chunkSize)))
  }
  return chunks
}

async function getSymptoms() {
  return (
    (await SymptomConditionMaster.findAll({
      raw: true,
      where: {
        symptom_type: ['symptom', 'both'],
      },
      order: [['symptom_name', 'ASC']],
    })) || []
  ).map((symptom: any) => ({
    ...symptom,
    symptom_name: symptom.symptom_name.replace(/\//g, ' ').replace(/\-/g, ' ').replace(/\'/g, ''),
  }))
}

async function getConditions() {
  return (
    (await SymptomConditionMaster.findAll({
      raw: true,
      where: {
        symptom_type: ['condition', 'both'],
      },
      order: [['symptom_name', 'ASC']],
    })) || []
  ).map((condition: any) => ({
    ...condition,
    symptom_name: condition.symptom_name.replace(/\//g, ' ').replace(/\-/g, ' ').replace(/\'/g, ''),
  }))
}
