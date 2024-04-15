import { symptoms } from './symptoms'
import config from '../config'
import MessageCypress from '../models/message_cypress'
import SymptomConditionMaster from '../models/symptom_condition_master'
import { Op } from 'sequelize'
import SymptomTreatmentsHumata from '../models/symptom_treatments_humata'
import * as _ from 'lodash'
import SymptomTreatments from '../models/symptom_treatments'
import TreatmentMaster from '../models/masters/treatment_master'

// const folder =
//   'https://app.humata.ai/ask/folder/70f141bc-ac8d-46fe-88f0-9b4d71895525?share_link=d672ab36-744b-4dae-8645-0731f0eeb05f'

// const folder =
//   'https://app.humata.ai/ask/folder/e57e77da-9a7d-4424-a6fc-4bbac81a9954?share_link=1344d71c-3f50-4e9a-ac1e-23cfd544139c'


const folder =
  'https://app.humata.ai/ask/folder/70f141bc-ac8d-46fe-88f0-9b4d71895525?share_link=d672ab36-744b-4dae-8645-0731f0eeb05f'

let messageCypressCache: any[] = []

export async function symptomTreatmentsHumata() {
  if (config.NODE_ENV !== 'qa') {
    console.log('NOT QA ENV')
    return
  }

  console.log('QA ENV - running symptomTreatmentsHumata')

  let symptomsAndConditions = await getSymptomsAndConditions()

  messageCypressCache = await MessageCypress.findAll({
    raw: true,
    attributes: ['answer', 'aux_data'],
    where: {
      folder
    }
  })

   await clearNotAnsweredQuestions()

//  await getTreatmentsPerSymptomCondition(symptomsAndConditions)

  // console.log('getSymptomsPerCondition');
  // conditions = await getSymptomsPerCondition(conditions, symptoms)
  // await saveConditions(conditions)

 // await cleanAndParseTreatments()

  // console.log('getTreatmentsPerSymptomAndCondition');

 // const treatmentCheckObject = await getTreatmentCheckObject()

  //await getTreatmentsPerSymptomAndCondition(symptomsAndConditions, treatmentCheckObject)
  // await saveConditions(symptomsAndConditions)

  // console.log('cleanAndParseTreatments');
  // await cleanAndParseTreatments()

  // console.log('getTreatmentsInformation');
  // await getTreatmentsInformation()

  await getTreatmentsBenefitsInformation()
}

async function getTreatmentCheckObject(){
  const treatmentCheckObject:any = {}

  const symptomTreatmentHumata = ((await SymptomTreatmentsHumata.findAll({
    raw: true,
    where:{
      humata_folder: folder
    }
  }))??[]).filter((sth: any) => ((sth.symptom_id && !sth.condition_id) || (!sth.symptom_id && sth.condition_id)))

  for(const sth of symptomTreatmentHumata){
    if(!sth.treatments){
      continue
    }

    const symptom_id = sth.symptom_id || sth.condition_id

    if(!treatmentCheckObject[symptom_id]){
      treatmentCheckObject[symptom_id] = {
        herb: false,
        supplement: false,
        foods_increase: false,
        foods_decrease: false,
        modalities_therapies: false,
      }
    }

    if(sth.treatments.herb?.length){
      treatmentCheckObject[symptom_id].herb = true
    }

    if(sth.treatments.supplement?.length){
      treatmentCheckObject[symptom_id].supplement = true
    }

    if(sth.treatments.foods_increase?.length){
      treatmentCheckObject[symptom_id].foods_increase = true
    }

    if(sth.treatments.foods_decrease?.length){
      treatmentCheckObject[symptom_id].foods_decrease = true
    }

    if(sth.treatments.modalities_therapies?.length){
      treatmentCheckObject[symptom_id].modalities_therapies = true
    }
  }

  return treatmentCheckObject

}

async function getNonIndexedSymptomsPerCondition(conditions: any[]) {
  let processId = new Date().getTime()

  for (const condition of conditions) {
    let question = `Does the text mention any symptom of ${condition.symptom_name}? Answer only yes or no.`

    let aux_data = {
      type: 'condition_not_indexed_symptom_yes_no',
      data: { condition },
    }

    await sendQuestion(question, aux_data, processId)
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  let cypressAnswers = [
    ...([...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []), ...messageCypressCache] ?? []),
    ...messageCypressCache,
  ]

  processId = new Date().getTime()

  for (const condition of conditions) {
    let answer = (
      cypressAnswers.find(
        (a: any) =>
          a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
          a?.aux_data?.type === 'condition_not_indexed_symptom_yes_no'
      ).answer ?? ''
    ).toLowerCase()

    if (!answer?.length) {
      throw new Error('Answer not found: condition_not_indexed_symptom_yes_no')
    }

    if (answer.startsWith('yes')) {
      condition.nonindexed_symptoms = []

      let question = `Give me a full list with bullet points of all symptoms of ${condition.symptom_name}?`

      let aux_data = {
        type: 'condition_not_indexed_symptom',
        data: { condition },
      }

      await sendQuestion(question, aux_data, processId)
    }
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  for (const condition of conditions) {
    if (condition.nonindexed_symptoms) {
      let answer =
        cypressAnswers.find(
          (a: any) =>
            a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
            a?.aux_data?.type === 'condition_not_indexed_symptom'
        ).answer ?? ''

      if (!answer?.length) {
        throw new Error('Answer not found: condition_not_indexed_symptom')
      }

      condition.nonindexed_symptoms = answer
        .split('\n')
        .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
        .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
    }
  }

  return conditions
}

async function extractTypesOfSymptomAndConditions() {
  const processId = new Date().getTime()

  const symptom = await SymptomConditionMaster.findAll({
    raw: true,
  })

  for (const s of symptom) {
    if (s?.symptom_name?.length) {
      let question = `Give me a full list with all types of ${s.symptom_name} mentioned in the text. The list should be formatted as bullet points.`

      let aux_data = {
        type: 'types_of_symptom_condition',
        data: null,
      }

      await sendQuestion(question, aux_data, processId)
    }
  }
}

async function cleanAndParseTreatments() {
  const symptomTreatments = await SymptomTreatmentsHumata.findAll({
    where: { treatments: { [Op.ne]: null } },
    raw: true,
  })

  for (const symptomTreatment of symptomTreatments) {
    if (symptomTreatment?.treatments?.herb?.length) {
      symptomTreatment.treatments.herb = symptomTreatment.treatments.herb.map((h: any) =>
        h?.type?.length
          ? h
          : {
              original_name: h,
              name: h
                .replace(/\[[\d,\s]+\]/g, '')
                .split(':')[0]
                .trim(),
              key_roles: null,
              expected_improvement: null,
              dosage: null,
              type: 'herb',
            }
      )
    }

    if (symptomTreatment?.treatments?.supplement?.length) {
      symptomTreatment.treatments.supplement = symptomTreatment.treatments.supplement.map((h: any) =>
        h?.type?.length
          ? h
          : {
              original_name: h,
              name: h
                .replace(/\[[\d,\s]+\]/g, '')
                .split(':')[0]
                .trim(),
              key_roles: null,
              expected_improvement: null,
              dosage: null,
              type: 'supplement',
            }
      )
    }

    if (symptomTreatment?.treatments?.modalities_therapies?.length) {
      symptomTreatment.treatments.modalities_therapies = symptomTreatment.treatments.modalities_therapies.map(
        (h: any) =>
          h?.type?.length
            ? h
            : {
                original_name: h,
                name: h
                  .replace(/\[[\d,\s]+\]/g, '')
                  .split(':')[0]
                  .trim(),
                key_roles: null,
                expected_improvement: null,
                dosage: null,
                type: 'modalities_therapies',
              }
      )
    }

    await SymptomTreatmentsHumata.update(
      { treatments: symptomTreatment.treatments },
      { where: { id: symptomTreatment.id } }
    )
  }
}

async function getTreatmentsInformation() {
  let processId = new Date().getTime()

  // const symptomAndTreatments = await SymptomTreatmentsHumata.findAll({
  //   where: { treatments: { [Op.ne]: null } },
  //   raw: true,
  // })

  // const symptomAndTreatments = (await SymptomTreatments.findAll({    
  //   raw: true,
  // })).filter((sth: any) => ((!sth?.summarized_data?.key_roles) && (sth?.humata??[]).filter((h: any) => h?.folder === folder).length) && ((!sth.symptom_name && sth.condition_name) || (sth.symptom_name && !sth.condition_name)))

  const treatmentMaster: any[] = await TreatmentMaster.findAll({ raw: true })

  const symptomAndTreatments = (await SymptomTreatments.findAll({    
    raw: true,
  })).filter((sth: any) => ((sth?.humata??[]).filter((h: any) => h?.folder === folder).length))


  console.log(`symptomAndTreatments: ${symptomAndTreatments.length}`);
  
  for (const symptomAndTreatment of symptomAndTreatments) {
    symptomAndTreatment.treatment_type = treatmentMaster.find((tm: any) => tm.treatment_id === symptomAndTreatment.treatment_id)?.treatment_type

    const treatment_name = (symptomAndTreatment?.humata??[]).find((h: any) => h?.folder === folder)?.name

    if(treatment_name?.length){
      let question = `Does the text mention the key roles played by ${treatment_name} to improve ${getToImproveText(symptomAndTreatment)}? Answer only yes or no.`
      let aux_data = {
        type: 'key_roles_yes_no',
        data: symptomAndTreatment,
      }

      await sendQuestion(question, aux_data, processId)

      let verb = 'taking'
      
      if (symptomAndTreatment.treatment_type === 'lifestyle') {
        verb = 'practicing'
      }

      question = `Does the text mention the expected improvement in ${getToImproveText(symptomAndTreatment)} when ${verb} ${treatment_name}? Answer only yes or no.`

      aux_data = {
        type: 'expected_improvement_yes_no',
        data: symptomAndTreatment,
      }

      await sendQuestion(question, aux_data, processId)

      if (symptomAndTreatment.treatment_type !== 'lifestyle') {
        question = `Does the text mention the dosage of ${treatment_name} to improve ${getToImproveText(symptomAndTreatment)}? Answer only yes or no.`

        aux_data = {
          type: 'dosage_yes_no',
          data: symptomAndTreatment,
        }

        await sendQuestion(question, aux_data, processId)
      }
    }
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  let cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  processId = new Date().getTime()

  for (const symptomAndTreatment of symptomAndTreatments) {
    const treatment_name = (symptomAndTreatment?.humata??[]).find((h: any) => h?.folder === folder)?.name

      let answer = (
        cypressAnswers.find(
          (a: any) => a?.aux_data?.data?.id && symptomAndTreatment.id && (a?.aux_data?.data?.id === symptomAndTreatment.id) && a?.aux_data?.type === 'key_roles_yes_no'
        )?.answer ?? ''
      )
        .replace(/{.*}/g, '')
        .trim()
        .replace(/\n/g, ',')
        .toLowerCase()

      if (!answer?.length) {
        console.log(symptomAndTreatment.id);
        throw new Error('Answer not found: key_roles_yes_no')
      }

      if (answer.startsWith('yes')) {
        let question = `What are the key roles played by ${treatment_name} to improve ${getToImproveText(symptomAndTreatment)}?`

        let aux_data = {
          type: 'key_roles',
          data: symptomAndTreatment,
        }

        await sendQuestion(question, aux_data, processId)
      }

      answer = (
        cypressAnswers.find(
          (a: any) =>
          a?.aux_data?.data?.id && symptomAndTreatment.id && (a?.aux_data?.data?.id === symptomAndTreatment.id) && a?.aux_data?.type === 'expected_improvement_yes_no'
        ).answer ?? ''
      )
        .replace(/{.*}/g, '')
        .trim()
        .replace(/\n/g, ',')
        .toLowerCase()

      if (!answer?.length) {
        throw new Error('Answer not found: expected_improvement_yes_no')
      }

      if (answer.startsWith('yes')) {
        let verb = 'taking'

        if (symptomAndTreatment.treatment_type === 'lifestyle') {
          verb = 'practicing'
        }

        let question = `What is the expected improvement in ${getToImproveText(symptomAndTreatment)} when ${verb} ${treatment_name}?`

        let aux_data = {
          type: 'expected_improvement',
          data: symptomAndTreatment,
        }

        await sendQuestion(question, aux_data, processId)
      }

      if (symptomAndTreatment.treatment_type !== 'lifestyle') {
        answer = (
          cypressAnswers.find(
            (a: any) =>  a?.aux_data?.data?.id && symptomAndTreatment.id && (a?.aux_data?.data?.id === symptomAndTreatment.id) && a?.aux_data?.type === 'dosage_yes_no'
          ).answer ?? ''
        )
          .replace(/{.*}/g, '')
          .trim()
          .replace(/\n/g, ',')
          .toLowerCase()

        if (!answer?.length) {
          throw new Error('Answer not found: dosage_yes_no')
        }

        if (answer.startsWith('yes')) {
          let question = `What is the dosage of ${treatment_name} to improve ${getToImproveText(symptomAndTreatment)}?`

          let aux_data = {
            type: 'dosage',
            data: symptomAndTreatment,
          }

          await sendQuestion(question, aux_data, processId)
        }
      }
    
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  let key_roles_count = 0
  let expected_improvement_count = 0
  let dosage_count = 0

  for (const symptomAndTreatment of symptomAndTreatments) {
    let key_roles:any = null;
    let expected_improvement:any = null;
    let dosage:any = null;

    let answer = (
      cypressAnswers.find(
        (a: any) =>  a?.aux_data?.data?.id && symptomAndTreatment.id && (a?.aux_data?.data?.id === symptomAndTreatment.id) && a?.aux_data?.type === 'key_roles'
      )?.answer ?? ''
    )?.replace(/{.*}/g, '')?.trim()?.replace(/\n/g, ',')?.toLowerCase()

      if (answer?.length) {
        key_roles = answer
        key_roles_count++
      }

      answer = (
        cypressAnswers.find(
          (a: any) =>  a?.aux_data?.data?.id && symptomAndTreatment.id && (a?.aux_data?.data?.id === symptomAndTreatment.id) && a?.aux_data?.type === 'expected_improvement'
        )?.answer ?? ''
      )?.replace(/{.*}/g, '')?.trim()?.replace(/\n/g, ',')?.toLowerCase()

      if (answer?.length) {
        expected_improvement = answer
        expected_improvement_count++
      }

      answer = (
        cypressAnswers.find(
          (a: any) =>  a?.aux_data?.data?.id && symptomAndTreatment.id && (a?.aux_data?.data?.id === symptomAndTreatment.id) && a?.aux_data?.type === 'dosage'
        )?.answer ?? ''
      )?.replace(/{.*}/g, '')?.trim()?.replace(/\n/g, ',')?.toLowerCase()

      if (answer?.length) {
        dosage = answer
        dosage_count++
      }

    symptomAndTreatment.humata = (symptomAndTreatment.humata??[]).map((h: any) => {
      if(h.folder === folder){
        h.key_roles = key_roles
        h.expected_improvement = expected_improvement
        h.dosage = dosage
      }

      return h
    })

    if(!symptomAndTreatment?.summarized_data){
      symptomAndTreatment.summarized_data = {}
    }

    if(!symptomAndTreatment?.summarized_data?.key_roles){
      symptomAndTreatment.summarized_data.key_roles = key_roles
    }

    if(!symptomAndTreatment?.summarized_data?.expected_improvement){
      symptomAndTreatment.summarized_data.expected_improvement = expected_improvement
    }

    if(!symptomAndTreatment?.summarized_data?.dosage && dosage?.length){
      symptomAndTreatment.summarized_data.dosage = dosage
    }

    await SymptomTreatments.update(
      { humata: symptomAndTreatment.humata, summarized_data: symptomAndTreatment.summarized_data },
      { where: { id: symptomAndTreatment.id } }
    )
  }

  console.log(`key_roles_count: ${key_roles_count}`);
  console.log(`expected_improvement_count: ${expected_improvement_count}`);
  console.log(`dosage_count: ${dosage_count}`);

  // for (const symptomAndTreatment of symptomAndTreatments) {
  //   for (const herb of symptomAndTreatment?.treatments?.herb ?? []) {
  //     let answer = (
  //       cypressAnswers.find(
  //         (a: any) => a?.aux_data?.data?.treatment?.name === herb.name && a?.aux_data?.type === 'key_roles'
  //       ).answer ?? ''
  //     )
  //       .replace(/{.*}/g, '')
  //       .trim()
  //       .replace(/\n/g, ',')
  //       .toLowerCase()

  //     if (!answer?.length) {
  //       throw new Error('Answer not found: key_roles')
  //     }

  //     if (answer.length) {
  //       herb.key_roles = answer
  //     }

  //     answer = (
  //       cypressAnswers.find(
  //         (a: any) => a?.aux_data?.data?.treatment?.name === herb.name && a?.aux_data?.type === 'expected_improvement'
  //       ).answer ?? ''
  //     )
  //       .replace(/{.*}/g, '')
  //       .trim()
  //       .replace(/\n/g, ',')
  //       .toLowerCase()

  //     if (!answer?.length) {
  //       throw new Error('Answer not found: expected_improvement')
  //     }

  //     if (answer.length) {
  //       herb.expected_improvement = answer
  //     }

  //     answer = (
  //       cypressAnswers.find(
  //         (a: any) => a?.aux_data?.data?.treatment?.name === herb.name && a?.aux_data?.type === 'dosage'
  //       ).answer ?? ''
  //     )
  //       .replace(/{.*}/g, '')
  //       .trim()
  //       .replace(/\n/g, ',')
  //       .toLowerCase()

  //     if (!answer?.length) {
  //       throw new Error('Answer not found: dosage')
  //     }

  //     if (answer.length) {
  //       herb.dosage = answer
  //     }
  //   }

  //   for (const supplement of symptomAndTreatment?.treatments?.supplement ?? []) {
  //     let answer = (
  //       cypressAnswers.find(
  //         (a: any) => a?.aux_data?.data?.treatment?.name === supplement.name && a?.aux_data?.type === 'key_roles'
  //       ).answer ?? ''
  //     )
  //       .replace(/{.*}/g, '')
  //       .trim()
  //       .replace(/\n/g, ',')
  //       .toLowerCase()

  //     if (!answer?.length) {
  //       throw new Error('Answer not found: key_roles')
  //     }

  //     if (answer.length) {
  //       supplement.key_roles = answer
  //     }

  //     answer = (
  //       cypressAnswers.find(
  //         (a: any) =>
  //           a?.aux_data?.data?.treatment?.name === supplement.name && a?.aux_data?.type === 'expected_improvement'
  //       ).answer ?? ''
  //     )
  //       .replace(/{.*}/g, '')
  //       .trim()
  //       .replace(/\n/g, ',')
  //       .toLowerCase()

  //     if (!answer?.length) {
  //       throw new Error('Answer not found: expected_improvement')
  //     }

  //     if (answer.length) {
  //       supplement.expected_improvement = answer
  //     }

  //     answer = (
  //       cypressAnswers.find(
  //         (a: any) => a?.aux_data?.data?.treatment?.name === supplement.name && a?.aux_data?.type === 'dosage'
  //       ).answer ?? ''
  //     )
  //       .replace(/{.*}/g, '')
  //       .trim()
  //       .replace(/\n/g, ',')
  //       .toLowerCase()

  //     if (!answer?.length) {
  //       throw new Error('Answer not found: dosage')
  //     }

  //     if (answer.length) {
  //       supplement.dosage = answer
  //     }
  //   }

  //   for (const modalities_therapies of symptomAndTreatment?.treatments?.modalities_therapies ?? []) {
  //     let answer = (
  //       cypressAnswers.find(
  //         (a: any) =>
  //           a?.aux_data?.data?.treatment?.name === modalities_therapies.name && a?.aux_data?.type === 'key_roles'
  //       ).answer ?? ''
  //     )
  //       .replace(/{.*}/g, '')
  //       .trim()
  //       .replace(/\n/g, ',')
  //       .toLowerCase()

  //     if (!answer?.length) {
  //       throw new Error('Answer not found: key_roles')
  //     }

  //     if (answer.length) {
  //       modalities_therapies.key_roles = answer
  //     }

  //     answer = (
  //       cypressAnswers.find(
  //         (a: any) =>
  //           a?.aux_data?.data?.treatment?.name === modalities_therapies.name &&
  //           a?.aux_data?.type === 'expected_improvement'
  //       ).answer ?? ''
  //     )
  //       .replace(/{.*}/g, '')
  //       .trim()
  //       .replace(/\n/g, ',')
  //       .toLowerCase()

  //     if (!answer?.length) {
  //       throw new Error('Answer not found: expected_improvement')
  //     }

  //     if (answer.length) {
  //       modalities_therapies.expected_improvement = answer
  //     }
  //   }

  //   await SymptomTreatmentsHumata.update(
  //     { treatments: symptomAndTreatment.treatments },
  //     { where: { id: symptomAndTreatment.id } }
  //   )
  // }
}

async function getTreatmentsBenefitsInformation() {
  let processId = new Date().getTime()

  const symptomAndTreatments = (await SymptomTreatments.findAll({    
    raw: true,
  }))
  .filter((st: any) => (((st?.humata??[]).filter((h: any) => h?.folder === folder).length) && (!st?.summarized_data?.key_roles?.length) && (!st?.summarized_data?.benefit?.length)))  
  .filter((st: any) => (st.symptom_id && !st.condition_id) || (!st.symptom_id && st.condition_id))

  for (const symptomAndTreatment of symptomAndTreatments) {
    const treatment_name = (symptomAndTreatment?.humata??[]).find((h: any) => h?.folder === folder)?.name

    if(treatment_name?.length){
      let question = `Does the text mention how ${treatment_name} improves ${getToImproveText(symptomAndTreatment)}? Answer only yes or no.`
      let aux_data = {
        type: 'benefit_yes_no',
        data: symptomAndTreatment,
      }

      await sendQuestion(question, aux_data, processId)
    }
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  let cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  processId = new Date().getTime()

  for (const symptomAndTreatment of symptomAndTreatments) {
    const treatment_name = (symptomAndTreatment?.humata??[]).find((h: any) => h?.folder === folder)?.name

      let answer = (
        cypressAnswers.find(
          (a: any) => a?.aux_data?.data?.id && symptomAndTreatment.id && (a?.aux_data?.data?.id === symptomAndTreatment.id) && a?.aux_data?.type === 'benefit_yes_no'
        )?.answer ?? ''
      )
        .replace(/{.*}/g, '')
        .trim()
        .replace(/\n/g, ',')
        .toLowerCase()

      if (!answer?.length) {
        console.log(symptomAndTreatment.id);
        throw new Error('Answer not found: benefit_yes_no')
      }

      if (answer.startsWith('yes')) {
        let question = `How does ${treatment_name} help improve ${getToImproveText(symptomAndTreatment)}?`

        let aux_data = {
          type: 'benefit',
          data: symptomAndTreatment,
        }

        await sendQuestion(question, aux_data, processId)
      }
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]


  for (const symptomAndTreatment of symptomAndTreatments) {
    let benefit:any = null;

    let answer = (
      cypressAnswers.find(
        (a: any) =>  a?.aux_data?.data?.id && symptomAndTreatment.id && (a?.aux_data?.data?.id === symptomAndTreatment.id) && a?.aux_data?.type === 'benefit'
      )?.answer ?? ''
    )?.replace(/{.*}/g, '')?.trim()?.replace(/\n/g, ',')?.toLowerCase()

      if (answer?.length) {
        benefit = answer        
      }
     
    symptomAndTreatment.humata = (symptomAndTreatment.humata??[]).map((h: any) => {
      if(h.folder === folder){
        h.benefit = benefit        
      }

      return h
    })

    if(benefit?.length){
      await SymptomTreatments.update(
        { humata: symptomAndTreatment.humata},
        { where: { id: symptomAndTreatment.id } }
      )
    }
  
  }
  
}

async function getTreatmentsPerSymptomAndCondition(conditions: any[], treatmentCheckObject: any) {
  let processId = new Date().getTime()

  for (const condition of conditions) {
    for (const symptom of condition?.symptoms ?? []) {

      if(treatmentCheckObject[symptom.symptom_id]?.supplement && treatmentCheckObject[condition.symptom_id]?.supplement){
        let question = `Does the text mention any supplement that improves ${symptom.symptom_name} in people with ${condition.symptom_name}? Answer only yes or no.`

        let aux_data = {
          type: 'condition_symptom_supplement_yes_no',
          data: { condition, symptom },
        }

        await sendQuestion(question, aux_data, processId)
      }

      if(treatmentCheckObject[symptom.symptom_id]?.herb && treatmentCheckObject[condition.symptom_id]?.herb){
        let question = `Does the text mention any herb that improves ${symptom.symptom_name} in people with ${condition.symptom_name}? Answer only yes or no.`

        let aux_data = {
          type: 'condition_symptom_herb_yes_no',
          data: { condition, symptom },
        }

        await sendQuestion(question, aux_data, processId)
      }

      // if(treatmentCheckObject[symptom.symptom_id]?.foods_increase && treatmentCheckObject[condition.symptom_id]?.foods_increase){
      //   let question = `Does the text mention foods to increase that improves ${symptom.symptom_name} in people with ${condition.symptom_name}? Answer only yes or no.`

      //   let aux_data = {
      //     type: 'condition_symptom_foods_increase_yes_no',
      //     data: { condition, symptom },
      //   }

      //   await sendQuestion(question, aux_data, processId)
      // }
      
      // if(treatmentCheckObject[symptom.symptom_id]?.foods_decrease && treatmentCheckObject[condition.symptom_id]?.foods_decrease){
      //   let question = `Does the text mention foods to decrease that improves ${symptom.symptom_name} in people with ${condition.symptom_name}? Answer only yes or no.`

      //   let aux_data = {
      //     type: 'condition_symptom_foods_decrease_yes_no',
      //     data: { condition, symptom },
      //   }
  
      //   await sendQuestion(question, aux_data, processId)
      // }

      if(treatmentCheckObject[symptom.symptom_id]?.modalities_therapies && treatmentCheckObject[condition.symptom_id]?.modalities_therapies){
        let question = `Does the text mention any modalities or therapies that improves ${symptom.symptom_name} in people with ${condition.symptom_name}? Answer only yes or no.`

        let aux_data = {
          type: 'condition_symptom_modalities_therapies_yes_no',
          data: { condition, symptom },
        }

        await sendQuestion(question, aux_data, processId)
      }
    }
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  let cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  processId = new Date().getTime()

  for (const condition of conditions) {
    for (const symptom of condition?.symptoms ?? []) {
      symptom.treatments = {
        supplement: null,
        herb: null,
        foods_increase: null,
        foods_decrease: null,
        modalities_therapies: null,
      }

      if(treatmentCheckObject[symptom.symptom_id]?.supplement && treatmentCheckObject[condition.symptom_id]?.supplement){
        let answer = (
          cypressAnswers.find(
            (a: any) =>
              a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
              a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
              a?.aux_data?.type === 'condition_symptom_supplement_yes_no'
          ).answer ?? ''
        )
          .replace(/{.*}/g, '')
          .trim()
          .replace(/\n/g, ',')
          .toLowerCase()
  
        if (!answer?.length) {
          throw new Error('Answer not found: condition_symptom_supplement_yes_no')
        }
  
        if (answer.startsWith('yes')) {
          symptom.treatments.supplement = []
  
          let question = `Give me a full list with bullet points of all supplements mentioned in the text that improve ${symptom.symptom_name} in people with ${condition.symptom_name}`
  
          let aux_data = {
            type: 'condition_symptom_supplement',
            data: { condition, symptom },
          }
  
          await sendQuestion(question, aux_data, processId)
        }
      }

      if(treatmentCheckObject[symptom.symptom_id]?.herb && treatmentCheckObject[condition.symptom_id]?.herb){
        let answer = (
          cypressAnswers.find(
            (a: any) =>
              a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
              a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
              a?.aux_data?.type === 'condition_symptom_herb_yes_no'
          ).answer ?? ''
        )
          .replace(/{.*}/g, '')
          .trim()
          .replace(/\n/g, ',')
          .toLowerCase()
  
        if (!answer?.length) {
          throw new Error('Answer not found: condition_symptom_herb_yes_no')
        }
  
        if (answer.startsWith('yes')) {
          symptom.treatments.herb = []
  
          let question = `Give me a full list with bullet points of all herbs mentioned in the text that improve ${symptom.symptom_name} in people with ${condition.symptom_name}`
  
          let aux_data = {
            type: 'condition_symptom_herb',
            data: { condition, symptom },
          }
  
          await sendQuestion(question, aux_data, processId)
        }
      }

      // if(treatmentCheckObject[symptom.symptom_id]?.foods_increase && treatmentCheckObject[condition.symptom_id]?.foods_increase){
      //   let answer = (
      //     cypressAnswers.find(
      //       (a: any) =>
      //         a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
      //         a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
      //         a?.aux_data?.type === 'condition_symptom_foods_increase_yes_no'
      //     ).answer ?? ''
      //   )
      //     .replace(/{.*}/g, '')
      //     .trim()
      //     .replace(/\n/g, ',')
      //     .toLowerCase()
  
      //   if (!answer?.length) {
      //     throw new Error('Answer not found: condition_symptom_foods_increase_yes_no')
      //   }
  
      //   if (answer.startsWith('yes')) {
      //     symptom.treatments.foods_increase = []
  
      //     let question = `Give me a full list with bullet points of all foods to increase mentioned in the text that improve ${symptom.symptom_name} in people with ${condition.symptom_name}`
  
      //     let aux_data = {
      //       type: 'condition_symptom_foods_increase',
      //       data: { condition, symptom },
      //     }
  
      //     await sendQuestion(question, aux_data, processId)
      //   }
      // }

      // if(treatmentCheckObject[symptom.symptom_id]?.foods_decrease && treatmentCheckObject[condition.symptom_id]?.foods_decrease){
      //   let answer = (
      //     cypressAnswers.find(
      //       (a: any) =>
      //         a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
      //         a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
      //         a?.aux_data?.type === 'condition_symptom_foods_decrease_yes_no'
      //     ).answer ?? ''
      //   )
      //     .replace(/{.*}/g, '')
      //     .trim()
      //     .replace(/\n/g, ',')
      //     .toLowerCase()
  
      //   if (!answer?.length) {
      //     throw new Error('Answer not found: condition_symptom_foods_decrease_yes_no')
      //   }
  
      //   if (answer.startsWith('yes')) {
      //     symptom.treatments.foods_decrease = []
  
      //     let question = `Give me a full list with bullet points of all foods to decrease mentioned in the text that improve ${symptom.symptom_name} in people with ${condition.symptom_name}`
  
      //     let aux_data = {
      //       type: 'condition_symptom_foods_decrease',
      //       data: { condition, symptom },
      //     }
  
      //     await sendQuestion(question, aux_data, processId)
      //   }
      // }

      if(treatmentCheckObject[symptom.symptom_id]?.modalities_therapies && treatmentCheckObject[condition.symptom_id]?.modalities_therapies){
        let answer = (
          cypressAnswers.find(
            (a: any) =>
              a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
              a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
              a?.aux_data?.type === 'condition_symptom_modalities_therapies_yes_no'
          ).answer ?? ''
        )
          .replace(/{.*}/g, '')
          .trim()
          .replace(/\n/g, ',')
          .toLowerCase()
  
        if (!answer?.length) {
          throw new Error('Answer not found: condition_symptom_modalities_therapies_yes_no')
        }
  
        if (answer.startsWith('yes')) {
          symptom.treatments.modalities_therapies = []
  
          let question = `Give me a full list with bullet points of all modalities or therapies mentioned in the text that improve ${symptom.symptom_name} in people with ${condition.symptom_name}`
  
          let aux_data = {
            type: 'condition_symptom_modalities_therapies',
            data: { condition, symptom },
          }
  
          await sendQuestion(question, aux_data, processId)
        }
      }
    }
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  for (const condition of conditions) {
    for (const symptom of condition?.symptoms ?? []) {
      if (symptom.treatments.supplement) {
        let answer =
          cypressAnswers.find(
            (a: any) =>
              a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
              a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
              a?.aux_data?.type === 'condition_symptom_supplement'
          ).answer ?? ''

        if (!answer?.length) {
          throw new Error('Answer not found: condition_symptom_supplement')
        }

        symptom.treatments.supplement = answer
          .split('\n')
          .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
          .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
      }

      if (symptom.treatments.herb) {
        let answer =
          cypressAnswers.find(
            (a: any) =>
              a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
              a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
              a?.aux_data?.type === 'condition_symptom_herb'
          ).answer ?? ''

        if (!answer?.length) {
          throw new Error('Answer not found: condition_symptom_herb')
        }

        symptom.treatments.herb = answer
          .split('\n')
          .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
          .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
      }

      // if (symptom.treatments.foods_increase) {
      //   let answer =
      //     cypressAnswers.find(
      //       (a: any) =>
      //         a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
      //         a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
      //         a?.aux_data?.type === 'condition_symptom_foods_increase'
      //     ).answer ?? ''

      //   if (!answer?.length) {
      //     throw new Error('Answer not found: condition_symptom_foods_increase')
      //   }

      //   symptom.treatments.foods_increase = answer
      //     .split('\n')
      //     .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
      //     .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
      // }

      // if (symptom.treatments.foods_decrease) {
      //   let answer =
      //     cypressAnswers.find(
      //       (a: any) =>
      //         a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
      //         a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
      //         a?.aux_data?.type === 'condition_symptom_foods_decrease'
      //     ).answer ?? ''

      //   if (!answer?.length) {
      //     throw new Error('Answer not found: condition_symptom_foods_decrease')
      //   }

      //   symptom.treatments.foods_decrease = answer
      //     .split('\n')
      //     .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
      //     .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
      // }

      if (symptom.treatments.modalities_therapies) {
        let answer =
          cypressAnswers.find(
            (a: any) =>
              a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
              a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
              a?.aux_data?.type === 'condition_symptom_modalities_therapies'
          ).answer ?? ''

        if (!answer?.length) {
          throw new Error('Answer not found: condition_symptom_modalities_therapies')
        }

        symptom.treatments.modalities_therapies = answer
          .split('\n')
          .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
          .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
      }
    }
  }

  return conditions
}

async function getTreatmentsPerSymptomCondition(symptomsAndConditions: any[]) {
  const conditions = [...symptomsAndConditions]

  let processId = new Date().getTime()

  for (const condition of conditions) {
    let question = `Does the text mention any supplement that improves ${condition.symptom_name}? Answer only yes or no.`

    let aux_data = {
      type: 'condition_supplement_yes_no',
      data: { condition },
    }

    await sendQuestion(question, aux_data, processId)

    question = `Does the text mention any herb that improves ${condition.symptom_name}? Answer only yes or no.`

    aux_data = {
      type: 'condition_herb_yes_no',
      data: { condition },
    }

    await sendQuestion(question, aux_data, processId)

    // question = `Does the text mention foods to increase that improves ${condition.symptom_name}? Answer only yes or no.`

    // aux_data = {
    //   type: 'condition_foods_increase_yes_no',
    //   data: { condition },
    // }

    // await sendQuestion(question, aux_data, processId)

    // question = `Does the text mention foods to decrease that improves ${condition.symptom_name}? Answer only yes or no.`

    // aux_data = {
    //   type: 'condition_foods_decrease_yes_no',
    //   data: { condition },
    // }

    // await sendQuestion(question, aux_data, processId)

    question = `Does the text mention any modalities or therapies that improves ${condition.symptom_name}? Answer only yes or no.`

    aux_data = {
      type: 'condition_modalities_therapies_yes_no',
      data: { condition },
    }

    await sendQuestion(question, aux_data, processId)
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  let cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  processId = new Date().getTime()

  for (const condition of conditions) {
    condition.treatments = {
      supplement: null,
      herb: null,
      foods_increase: null,
      foods_decrease: null,
      modalities_therapies: null,
    }

    let answer = (
      cypressAnswers.find(
        (a: any) =>
          a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
          a?.aux_data?.type === 'condition_supplement_yes_no'
      ).answer ?? ''
    )
      .replace(/{.*}/g, '')
      .trim()
      .replace(/\n/g, ',')
      .toLowerCase()

    if (!answer?.length) {
      throw new Error('Answer not found: condition_supplement_yes_no')
    }

    if (answer.startsWith('yes')) {
      condition.treatments.supplement = []

      let question = `Give me a full list with bullet points of all supplements mentioned in the text that improve ${condition.symptom_name}`

      let aux_data = {
        type: 'condition_supplement',
        data: { condition },
      }

      await sendQuestion(question, aux_data, processId)
    }

    answer = (
      cypressAnswers.find(
        (a: any) =>
          a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
          a?.aux_data?.type === 'condition_herb_yes_no'
      ).answer ?? ''
    )
      .replace(/{.*}/g, '')
      .trim()
      .replace(/\n/g, ',')
      .toLowerCase()

    if (!answer?.length) {
      throw new Error('Answer not found: condition_herb_yes_no')
    }

    if (answer.startsWith('yes')) {
      condition.treatments.herb = []

      let question = `Give me a full list with bullet points of all herbs mentioned in the text that improve ${condition.symptom_name}`

      let aux_data = {
        type: 'condition_herb',
        data: { condition },
      }

      await sendQuestion(question, aux_data, processId)
    }

    // answer = (
    //   cypressAnswers.find(
    //     (a: any) =>
    //       a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
    //       a?.aux_data?.type === 'condition_foods_increase_yes_no'
    //   ).answer ?? ''
    // )
    //   .replace(/{.*}/g, '')
    //   .trim()
    //   .replace(/\n/g, ',')
    //   .toLowerCase()

    // if (!answer?.length) {
    //   throw new Error('Answer not found: condition_foods_increase_yes_no')
    // }

    // if (answer.startsWith('yes')) {
    //   condition.treatments.foods_increase = []

    //   let question = `Give me a full list with bullet points of all foods to increase mentioned in the text that improve ${condition.symptom_name}`

    //   let aux_data = {
    //     type: 'condition_foods_increase',
    //     data: { condition },
    //   }

    //   await sendQuestion(question, aux_data, processId)
    // }

    // answer = (
    //   cypressAnswers.find(
    //     (a: any) =>
    //       a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
    //       a?.aux_data?.type === 'condition_foods_decrease_yes_no'
    //   ).answer ?? ''
    // )
    //   .replace(/{.*}/g, '')
    //   .trim()
    //   .replace(/\n/g, ',')
    //   .toLowerCase()

    // if (!answer?.length) {
    //   throw new Error('Answer not found: condition_foods_decrease_yes_no')
    // }

    // if (answer.startsWith('yes')) {
    //   condition.treatments.foods_decrease = []

    //   let question = `Give me a full list with bullet points of all foods to decrease mentioned in the text that improve ${condition.symptom_name}`

    //   let aux_data = {
    //     type: 'condition_foods_decrease',
    //     data: { condition },
    //   }

    //   await sendQuestion(question, aux_data, processId)
    // }

    answer = (
      cypressAnswers.find(
        (a: any) =>
          a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
          a?.aux_data?.type === 'condition_modalities_therapies_yes_no'
      ).answer ?? ''
    )
      .replace(/{.*}/g, '')
      .trim()
      .replace(/\n/g, ',')
      .toLowerCase()

    if (!answer?.length) {
      throw new Error('Answer not found: condition_modalities_therapies_yes_no')
    }

    if (answer.startsWith('yes')) {
      condition.treatments.modalities_therapies = []

      let question = `Give me a full list with bullet points of all modalities or therapies mentioned in the text that improve ${condition.symptom_name}`

      let aux_data = {
        type: 'condition_modalities_therapies',
        data: { condition },
      }

      await sendQuestion(question, aux_data, processId)
    }
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  for (const condition of conditions) {
    if (condition.treatments.supplement) {
      let answer =
        cypressAnswers.find(
          (a: any) =>
            a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
            a?.aux_data?.type === 'condition_supplement'
        ).answer ?? ''

      if (!answer?.length) {
        throw new Error('Answer not found: condition_supplement')
      }

      condition.treatments.supplement = answer
        .split('\n')
        .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
        .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
    }

    if (condition.treatments.herb) {
      let answer =
        cypressAnswers.find(
          (a: any) =>
            a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id && a?.aux_data?.type === 'condition_herb'
        ).answer ?? ''

      if (!answer?.length) {
        throw new Error('Answer not found: condition_herb')
      }

      condition.treatments.herb = answer
        .split('\n')
        .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
        .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
    }

    // if (condition.treatments.foods_increase) {
    //   let answer =
    //     cypressAnswers.find(
    //       (a: any) =>
    //         a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
    //         a?.aux_data?.type === 'condition_foods_increase'
    //     ).answer ?? ''

    //   if (!answer?.length) {
    //     throw new Error('Answer not found: condition_foods_increase')
    //   }

    //   condition.treatments.foods_increase = answer
    //     .split('\n')
    //     .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
    //     .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
    // }

    // if (condition.treatments.foods_decrease) {
    //   let answer =
    //     cypressAnswers.find(
    //       (a: any) =>
    //         a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
    //         a?.aux_data?.type === 'condition_foods_decrease'
    //     ).answer ?? ''

    //   if (!answer?.length) {
    //     throw new Error('Answer not found: condition_foods_decrease')
    //   }

    //   condition.treatments.foods_decrease = answer
    //     .split('\n')
    //     .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
    //     .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
    // }

    if (condition.treatments.modalities_therapies) {
      let answer =
        cypressAnswers.find(
          (a: any) =>
            a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
            a?.aux_data?.type === 'condition_modalities_therapies'
        ).answer ?? ''

      if (!answer?.length) {
        throw new Error('Answer not found: condition_modalities_therapies')
      }

      condition.treatments.modalities_therapies = answer
        .split('\n')
        .map((t: string) => t.replace(/\[\d+\]/g, '').trim())
        .filter((t: string) => !(t ?? '').includes('.pdf') && t?.length)
    }
  }

  for (const condition of conditions) {
    if (condition?.symptom_type === 'symptom') {
      if (
        !(await SymptomTreatmentsHumata.findOne({
          where: { symptom_id: condition.symptom_id, humata_folder: folder, condition_id: { [Op.eq]: null } },
          raw: true,
        }))
      ) {
        await SymptomTreatmentsHumata.create({
          condition_id: null,
          condition_name: null,
          symptom_id: condition.symptom_id,
          symptom_name: condition.symptom_name,
          humata_folder: folder,
          treatments: condition?.treatments ?? null,
          nonindexed_symptoms: condition?.nonindexed_symptoms ?? null,
        })
      } else {
        await SymptomTreatmentsHumata.update(
          { treatments: condition?.treatments ?? null, nonindexed_symptoms: condition?.nonindexed_symptoms ?? null },
          { where: { symptom_id: condition.symptom_id, humata_folder: folder, condition_id: { [Op.eq]: null } } }
        )
      }
    }

    if (condition?.symptom_type === 'condition') {
      if (
        !(await SymptomTreatmentsHumata.findOne({
          where: { condition_id: condition.symptom_id, humata_folder: folder, symptom_id: { [Op.eq]: null } },
          raw: true,
        }))
      ) {
        await SymptomTreatmentsHumata.create({
          condition_id: condition.symptom_id,
          condition_name: condition.symptom_name,
          symptom_id: null,
          symptom_name: null,
          humata_folder: folder,
          treatments: condition?.treatments ?? null,
          nonindexed_symptoms: condition?.nonindexed_symptoms ?? null,
        })
      } else {
        await SymptomTreatmentsHumata.update(
          { treatments: condition?.treatments ?? null, nonindexed_symptoms: condition?.nonindexed_symptoms ?? null },
          { where: { condition_id: condition.symptom_id, humata_folder: folder, symptom_id: { [Op.eq]: null } } }
        )
      }
    }
  }
}

async function clearNotAnsweredQuestions() {
  const notAnswered = await MessageCypress.findAll({ where: { answer: { [Op.eq]: null } }, raw: true })

  console.log(`Deleting ${notAnswered.length} not answered questions...`)

  for (const question of notAnswered) {
    await MessageCypress.destroy({ where: { id: question.id } })
  }
}

async function getSymptomsPerCondition(conditions: any[], symptoms: any) {
  const processId = new Date().getTime()

  for (const condition of conditions) {
    for (const symptom of symptoms) {
      const question = `Does the text mention that ${symptom.symptom_name} is a symptom of ${condition.symptom_name}? Answer only yes or no`

      const aux_data = {
        type: 'condition_symptom_yes_no',
        data: { condition, symptom },
      }

      await sendQuestion(question, aux_data, processId)
    }
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  const cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  let i = 0

  for (const condition of conditions) {
    i++

    console.log(`Processing condition ${i} of ${conditions.length}`)

    condition.symptoms = []

    for (const symptom of symptoms) {
      const answer = (
        cypressAnswers.find(
          (a: any) =>
            a?.aux_data?.data?.condition?.symptom_id === condition.symptom_id &&
            a?.aux_data?.data?.symptom?.symptom_id === symptom.symptom_id &&
            a?.aux_data?.type === 'condition_symptom_yes_no'
        ).answer ?? ''
      )
        .replace(/{.*}/g, '')
        .trim()
        .replace(/\n/g, ',')
        .toLowerCase()

      if (!answer?.length) {
        throw new Error('Answer not found: condition_symptom_yes_no')
      }

      if (answer.startsWith('yes')) {
        condition.symptoms.push({ ...symptom })
      }
    }
  }

  return conditions
}

async function askCondition(conditions: any[]) {
  const conditionAnswers: any = {}

  const processId = new Date().getTime()

  for (const condition of conditions) {
    const question = `Does the text mention anything about ${condition.symptom_name}? Answer only yes or no.`

    const aux_data = {
      type: 'condition_yes_no',
      data: condition,
    }

    await sendQuestion(question, aux_data, processId)
  }

  while (await MessageCypress.findOne({ where: { answer: { [Op.eq]: null }, processId }, raw: true })) {
    console.log('Waiting for answers...')
    await sleep(120000)
  }

  console.log('All answers received')

  const cypressAnswers = [
    ...((await MessageCypress.findAll({ where: { processId }, raw: true })) ?? []),
    ...messageCypressCache,
  ]

  for (const condition of conditions) {
    const answer = (
      cypressAnswers.find(
        (a: any) => a?.aux_data?.data?.symptom_id === condition.symptom_id && a?.aux_data?.type === 'condition_yes_no'
      ).answer ?? ''
    )
      .replace(/{.*}/g, '')
      .trim()
      .replace(/\n/g, ',')
      .toLowerCase()

    if (!answer?.length) {
      throw new Error('Answer not found: condition_yes_no')
    }

    conditionAnswers[condition.symptom_id] = null

    if (answer.startsWith('yes')) {
      conditionAnswers[condition.symptom_id] = true
    }

    if (answer.startsWith('no')) {
      conditionAnswers[condition.symptom_id] = false
    }
  }

  const approvedConditionsIds = Object.keys(conditionAnswers)
    .filter((conditionId: any) => conditionAnswers[conditionId] === true)
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

async function getSymptomsAndConditions() {
  const symptomsAndConditionsMaster: any[] = await SymptomConditionMaster.findAll({ raw: true })

  const symptomsTreatmentsHumata = (
    (await SymptomTreatmentsHumata.findAll({
      raw: true,
    })) ?? []
  ).filter((sth: any) => sth?.condition_id)

  const symptomsPerCondition = symptomsTreatmentsHumata.reduce((acc: any, sth: any) => {
    if(sth?.condition_id && sth?.symptom_id && sth?.symptom_name?.length){
      if (!acc[sth?.condition_id]) {
        acc[sth?.condition_id] = []
      }
  
      acc[sth?.condition_id].push((sth?.symptom_name??'').trim().toLowerCase())
    }

    return acc
  }, {})

  for (const condition of symptomsAndConditionsMaster.filter(
    (sc: any) => sc?.symptom_type === 'condition' && (sc?.symptoms?.length > 0)
  )) {
    for (const conditionSymptomName of condition.symptoms
      .split(';')
      .map((x: any) => x.trim().toLowerCase())
      .filter((x: any) => x.length > 0)) {
      if (!symptomsPerCondition[condition.symptom_id]) {
        symptomsPerCondition[condition.symptom_id] = []
      }

      symptomsPerCondition[condition.symptom_id].push((conditionSymptomName??'').trim().toLowerCase())
    }
  }

  for (const sc of symptomsAndConditionsMaster) {
    sc.symptoms = []

    if (sc.symptom_type === 'condition' && symptomsPerCondition[+sc.symptom_id]?.length > 0) {
      sc.symptoms = _.uniq(symptomsPerCondition[+sc.symptom_id])
        .map((x: any) =>
          symptomsAndConditionsMaster.find((sc: any) => sc.symptom_name.trim().toLowerCase() === x?.trim()?.toLowerCase())
        )
        .filter((x: any) => x?.symptom_id && sc.symptom_id && (x?.symptom_id !== sc.symptom_id))
        .map((x: any) => ({...x})) 
    }
  }

  return symptomsAndConditionsMaster
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
  )
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
  )
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sendQuestion(question: string, aux_data: any, processId: number) {
  if (
    messageCypressCache.find(
      (m: any) =>
        m.aux_data.type === aux_data.type &&
        m.aux_data?.data?.symptom_id === aux_data?.data?.symptom_id &&
        m.aux_data?.data?.condition?.symptom_id === aux_data?.data?.condition?.symptom_id &&
        m.aux_data?.data?.symptom?.symptom_id === aux_data?.data?.symptom?.symptom_id &&
        m.aux_data?.data?.treatment?.name === aux_data?.data?.treatment?.name &&
        m.aux_data?.data?.id === aux_data?.data?.id &&            
        m?.answer?.length
    )
  ) {
    return
  }

  let cached = false
  let cachedFrom = null
  let answer = null

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

function getToImproveText(symptomAndTreatment: any){
  if(symptomAndTreatment.symptom_name && symptomAndTreatment.condition_name){
    return `${symptomAndTreatment.symptom_name} in people with ${symptomAndTreatment.condition_name}`
  }

  return `${symptomAndTreatment.symptom_name || symptomAndTreatment.condition_name}`
}

async function saveConditions(conditions: any[]) {
  for (const condition of conditions) {
    if (
      !(await SymptomTreatmentsHumata.findOne({
        where: { condition_id: condition.symptom_id, humata_folder: folder, symptom_id: { [Op.eq]: null } },
        raw: true,
      }))
    ) {
      await SymptomTreatmentsHumata.create({
        condition_id: condition.symptom_id,
        condition_name: condition.symptom_name,
        symptom_id: null,
        symptom_name: null,
        humata_folder: folder,
        treatments: condition.treatments,
        nonindexed_symptoms: condition.nonindexed_symptoms,
      })
    } else {
      await SymptomTreatmentsHumata.update(
        { treatments: condition.treatments, nonindexed_symptoms: condition.nonindexed_symptoms },
        { where: { condition_id: condition.symptom_id, humata_folder: folder, symptom_id: { [Op.eq]: null } } }
      )
    }

    for (const symptom of condition?.symptoms ?? []) {
      if (
        !(await SymptomTreatmentsHumata.findOne({
          where: { condition_id: condition.symptom_id, humata_folder: folder, symptom_id: symptom.symptom_id },
          raw: true,
        }))
      ) {
        await SymptomTreatmentsHumata.create({
          condition_id: condition.symptom_id,
          condition_name: condition.symptom_name,
          symptom_id: symptom.symptom_id,
          symptom_name: symptom.symptom_name,
          humata_folder: folder,
          treatments: symptom.treatments,
        })
      } else {
        await SymptomTreatmentsHumata.update(
          { treatments: symptom.treatments },
          { where: { condition_id: condition.symptom_id, humata_folder: folder, symptom_id: symptom.symptom_id } }
        )
      }
    }
  }
}
