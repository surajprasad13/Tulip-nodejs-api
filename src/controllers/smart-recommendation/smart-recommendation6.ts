import { Request, Response } from 'express'
import SymptomConditionMaster from '../../models/symptom_condition_master'
import SymptomTreatments from '../../models/symptom_treatments'
import { getTreatmentsForUserConditions } from './treatments-for-user-conditions'
import { getTreatmentForUserPossibleConditions } from './treatment-for-user-possible-conditions'
import { getTreatmentsForUserSymptoms } from './treatments-for-user-symptoms'
import * as _ from 'lodash'
import TreatmentMaster from '../../models/masters/treatment_master'
import MedicineArticlesForbidden from '../../models/medicine_articles_forbidden'

const getSmartRecommendation6 = async (req: Request, res: Response) => {
  try {
    let { main_symptoms_conditions, other_symptoms_conditions, possible_conditions, user_constitution } = req.body

    possible_conditions = (possible_conditions ?? []).slice(0, 3)

    const symptomsById = ((await SymptomConditionMaster.findAll({ raw: true })) || []).reduce((acc: any, s: any) => {
      acc[+s.symptom_id] = {
        ...s,
      }

      return acc
    }, {})

    const userSymptomsAndConditions = [...main_symptoms_conditions, ...other_symptoms_conditions]

    const treatmentsMaster = await TreatmentMaster.findAll({ raw: true })

    const symptomsTreatments = ((await SymptomTreatments.findAll({ raw: true })) || []).map((st: any) => ({
      ...st,
      articles: st.articles.map((a: any) => ({
        url: a.url,
        title: a.title,
        articlePubmedId: a.pubmed_id,
        mainSymptomTreatment: true,
      })),
    }))

    const userSymptoms = userSymptomsAndConditions
      .map((s: any) => symptomsById[+s])
      .filter((s: any) => !!s && s.symptom_type === 'symptom')
    const userConditions = userSymptomsAndConditions
      .map((s: any) => symptomsById[+s])
      .filter((s: any) => !!s && s.symptom_type === 'condition')
    const userPossibleConditions = possible_conditions
      .map((s: any) => symptomsById[+s])
      .filter((s: any) => !!s && s.symptom_type === 'condition')

    // console.log('userSymptoms');
    // console.log(userSymptoms.map((s: any) => s.symptom_name));

    // console.log('userConditions');
    // console.log(userConditions.map((s: any) => s.symptom_name));
    
    const treatmentsIds = _.uniq([
      ...getTreatmentsForUserConditions(userSymptoms, userConditions, symptomsTreatments),
      ...getTreatmentForUserPossibleConditions(userSymptoms, userPossibleConditions, symptomsTreatments),
      ...((userConditions?.length === 0) ? (getTreatmentsForUserSymptoms(userSymptoms, symptomsTreatments)) : ([])),
    ])

    let treatmentsIdsSymptomsAndConditions: any = treatmentsIds.map((treatmentId: any) => {
      const treatmentMaster = treatmentsMaster.find((t: any) => +t.treatment_id === +treatmentId)

      return {
        treatmentId,
        type: treatmentMaster?.treatment_type,
        treatment_common_name: treatmentMaster?.common_names||treatmentMaster?.treatment_name,
        ayurvedic_name: treatmentMaster?.ayurvedic_name||treatmentMaster?.common_names||treatmentMaster?.treatment_name,
        chinese_name: treatmentMaster?.chinese_name||treatmentMaster?.common_names||treatmentMaster?.treatment_name,
        constitution: (treatmentMaster?.constitution??'').split(',').map((c: any) => +c.trim()).filter((c: any) => !!c),
        symptomsAndConditions: [],
        ayurvedic_description: treatmentMaster?.ayurvedic_description??'',
        chinese_description: treatmentMaster?.chinese_description??'',
        image_url: treatmentMaster?.image_url??'',
      }
    })

    for (const treatmentIdSymptomsAndConditions of treatmentsIdsSymptomsAndConditions) {
      if (
        (treatmentIdSymptomsAndConditions.type ?? '').includes('vitamin') ||
        (treatmentIdSymptomsAndConditions.type ?? '').includes('herb')
      ) {
        treatmentIdSymptomsAndConditions.type = 'supplement'
      } else {
        if ((treatmentIdSymptomsAndConditions.type ?? '').includes('food')) {
          treatmentIdSymptomsAndConditions.type = 'food'
        } else {
          treatmentIdSymptomsAndConditions.type = 'lifestyle'
        }
      }
    }

    for (const treatmentIdSymptomsAndConditions of treatmentsIdsSymptomsAndConditions) {
      for (const userSymptom of userSymptoms) {
        if (
          symptomsTreatments.find(
            (st: any) =>
              st.symptom_id === userSymptom.symptom_id &&
              !st.condition_id &&
              st.treatment_id === treatmentIdSymptomsAndConditions.treatmentId
          )
        ) {
          treatmentIdSymptomsAndConditions.symptomsAndConditions.push(userSymptom.symptom_id)
        }

        if (
          symptomsTreatments.find(
            (st: any) =>
              st.condition_id === userSymptom.symptom_id &&
              !st.symptom_id &&
              st.treatment_id === treatmentIdSymptomsAndConditions.treatmentId
          )
        ) {
          treatmentIdSymptomsAndConditions.symptomsAndConditions.push(userSymptom.symptom_id)
        }
      }

      for (const userConditionOrPossibleCondition of [...userConditions, ...userPossibleConditions]) {
        if (
          symptomsTreatments.find(
            (st: any) =>
              st.symptom_id === userConditionOrPossibleCondition.symptom_id &&
              !st.condition_id &&
              st.treatment_id === treatmentIdSymptomsAndConditions.treatmentId
          )
        ) {
          treatmentIdSymptomsAndConditions.symptomsAndConditions.push(userConditionOrPossibleCondition.symptom_id)
        }

        if (
          symptomsTreatments.find(
            (st: any) =>
              st.condition_id === userConditionOrPossibleCondition.symptom_id &&
              !st.symptom_id &&
              st.treatment_id === treatmentIdSymptomsAndConditions.treatmentId
          )
        ) {
          treatmentIdSymptomsAndConditions.symptomsAndConditions.push(userConditionOrPossibleCondition.symptom_id)
        }

        for (const userSymptom of userSymptoms) {
          if (
            symptomsTreatments.find(
              (st: any) =>
                st.condition_id === userConditionOrPossibleCondition.symptom_id &&
                st.symptom_id === userSymptom.symptom_id &&
                st.treatment_id === treatmentIdSymptomsAndConditions.treatmentId
            )
          ) {
            treatmentIdSymptomsAndConditions.symptomsAndConditions.push(userConditionOrPossibleCondition.symptom_id)
            treatmentIdSymptomsAndConditions.symptomsAndConditions.push(userSymptom.symptom_id)
          }

          if (
            symptomsTreatments.find(
              (st: any) =>
                st.symptom_id === userConditionOrPossibleCondition.symptom_id &&
                st.condition_id === userSymptom.symptom_id &&
                st.treatment_id === treatmentIdSymptomsAndConditions.treatmentId
            )
          ) {
            treatmentIdSymptomsAndConditions.symptomsAndConditions.push(userConditionOrPossibleCondition.symptom_id)
            treatmentIdSymptomsAndConditions.symptomsAndConditions.push(userSymptom.symptom_id)
          }
        }
      }
    }

    for (const treatmentIdSymptomsAndConditions of treatmentsIdsSymptomsAndConditions) {
      treatmentIdSymptomsAndConditions.symptomsAndConditions = _.uniq(
        treatmentIdSymptomsAndConditions.symptomsAndConditions
      )
    }

    let supplements = treatmentsIdsSymptomsAndConditions
      .filter((t: any) => t.type === 'supplement')
      .sort((a: any, b: any) => {
        return b.symptomsAndConditions.length - a.symptomsAndConditions.length
      })

    let foods = treatmentsIdsSymptomsAndConditions
      .filter((t: any) => t.type === 'food')
      .sort((a: any, b: any) => {
        return b.symptomsAndConditions.length - a.symptomsAndConditions.length
      })

    let lifestyles = treatmentsIdsSymptomsAndConditions
      .filter((t: any) => t.type === 'lifestyle')
      .sort((a: any, b: any) => {
        return b.symptomsAndConditions.length - a.symptomsAndConditions.length
      })

    const medicineArticlesForbidden = await getForbiddenArticles()

    for(const supplement of supplements){
        supplement.symptomsAndConditions = populateSymptomAndCondition(supplement.symptomsAndConditions, symptomsTreatments, symptomsById, supplement.treatmentId)
        supplement.articles = filterForbiddenArticles(mergeArticles(supplement), medicineArticlesForbidden)
        supplement.totalArticles = supplement.articles.length
        supplement.articles = supplement.articles.slice(0, 6)
        supplement.treatmentInformationItems = buildTreatmentInformationItems(supplement, symptomsTreatments, userSymptomsAndConditions)
    }

    for(const food of foods){
        food.symptomsAndConditions = populateSymptomAndCondition(food.symptomsAndConditions, symptomsTreatments, symptomsById, food.treatmentId)
        food.articles = filterForbiddenArticles(mergeArticles(food), medicineArticlesForbidden)
        food.totalArticles = food.articles.length
        food.articles = food.articles.slice(0, 6)
        food.treatmentInformationItems = buildTreatmentInformationItems(food, symptomsTreatments, userSymptomsAndConditions)
    }

    for(const lifestyle of lifestyles){
        lifestyle.symptomsAndConditions = populateSymptomAndCondition(lifestyle.symptomsAndConditions, symptomsTreatments, symptomsById, lifestyle.treatmentId)
        lifestyle.articles = filterForbiddenArticles(mergeArticles(lifestyle), medicineArticlesForbidden)
        lifestyle.totalArticles = lifestyle.articles.length
        lifestyle.articles = lifestyle.articles.slice(0, 6)
        lifestyle.treatmentInformationItems = buildTreatmentInformationItems(lifestyle, symptomsTreatments, userSymptomsAndConditions)
    }

    let ayurvedic_and_chinese_treatments:any[] = []
    let ayurvedic_treatments_filtered:any[] = []
    let chinese_treatments_filtered:any[] = []
    let ayurvedic_treatments_non_filtered:any[] = []
    let chinese_treatments_non_filtered:any[] = []

    if(user_constitution?.length){
      console.log('user_constitution');
      console.log(user_constitution);
      
      ayurvedic_and_chinese_treatments = [...supplements, ...foods, ...lifestyles].filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => user_constitution.includes(c)) && t.constitution.some((c: any) => [1,2,3].includes(c)) && t.constitution.some((c: any) => [4,5,6,7,8].includes(c))) 
      
      ayurvedic_treatments_non_filtered = [...supplements, ...foods, ...lifestyles].filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => [1,2,3].includes(c)))
      chinese_treatments_non_filtered = [...supplements, ...foods, ...lifestyles].filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => [4,5,6,7,8].includes(c)))
      ayurvedic_treatments_filtered = [...supplements, ...foods, ...lifestyles].filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => user_constitution.includes(c)) && t.constitution.some((c: any) => [1,2,3].includes(c)) && !t.constitution.some((c: any) => [4,5,6,7,8].includes(c))) 
      chinese_treatments_filtered = [...supplements, ...foods, ...lifestyles].filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => user_constitution.includes(c)) && t.constitution.some((c: any) => ![1,2,3].includes(c)) && t.constitution.some((c: any) => [4,5,6,7,8].includes(c))) 
    }
    
    ayurvedic_and_chinese_treatments.forEach((t: any, idx: number) => {
      if(idx % 2 === 0){
        ayurvedic_treatments_filtered.push(t)
        ayurvedic_treatments_non_filtered.push(t)
      }
      else{
        chinese_treatments_filtered.push(t)
        chinese_treatments_non_filtered.push(t)
      }
    })

    ayurvedic_treatments_filtered = _.uniqBy(ayurvedic_treatments_filtered, 'treatmentId')
    chinese_treatments_filtered = _.uniqBy(chinese_treatments_filtered, 'treatmentId')
    ayurvedic_treatments_non_filtered = _.uniqBy(ayurvedic_treatments_non_filtered, 'treatmentId')
    chinese_treatments_non_filtered = _.uniqBy(chinese_treatments_non_filtered, 'treatmentId')
    
    ayurvedic_treatments_filtered.sort((a: any, b: any) => {
      return b.symptomsAndConditions.length - a.symptomsAndConditions.length
    })

    chinese_treatments_filtered.sort((a: any, b: any) => {
      return b.symptomsAndConditions.length - a.symptomsAndConditions.length
    })

    ayurvedic_treatments_non_filtered.sort((a: any, b: any) => {
      return b.symptomsAndConditions.length - a.symptomsAndConditions.length
    })

    chinese_treatments_non_filtered.sort((a: any, b: any) => {
      return b.symptomsAndConditions.length - a.symptomsAndConditions.length
    })

    const ayurvedic_treatments = ayurvedic_treatments_filtered?.length <= 5 ? ayurvedic_treatments_non_filtered.slice(0, 10) : ayurvedic_treatments_filtered.slice(0, 10)
    const chinese_treatments = chinese_treatments_filtered?.length <= 5 ? chinese_treatments_non_filtered.slice(0, 10) : chinese_treatments_filtered.slice(0, 10)

    supplements = mergeSimilarTreatments(supplements, treatmentsMaster)
    supplements = removeSimilarTreatments(supplements)

    supplements = supplements.slice(0, 6)
    foods = foods.slice(0, 6)
    lifestyles = lifestyles.slice(0, 6)

    return res.json({ supplements, foods, lifestyles, ayurvedic_treatments, chinese_treatments })       
  } catch (error) {
    console.log(error)

    res.status(400).send({ error })
  }
}

function removeSimilarTreatments(supplements: any[]) {
  const supplementsOut:any[] = []

  const groups = [
    {
      count: 0,
      treatments: [30905, 30906, 30907, 30908, 30909, 30910, 30912, 30913, 30915, 30916, 30917, 30918, 30919, 30920, 30921, 30922, 30924, 30925, 30928, 30929, 30930, 30931, 30932, 30933, 30934, 30936, 30937, 30938, 30939, 30940, 30941, 30942, 30943, 30944, 30945, 30946, 30947, 30948, 30949, 30950, 30951, 30952, 30953, 30954, 30955, 30956, 30957, 30958, 30959, 30960, 30961, 30962, 30964, 30965, 30966, 30967, 30969, 30970, 30971, 30972, 30973, 30974, 30975, 30976, 30977, 30978, 30979, 30980, 30981, 30982, 30983, 30984, 30985, 30986, 30987, 30988, 30989, 30990, 30991, 30992, 30993, 30995, 30996, 30997, 30998, 30999, 31000, 31001, 31002, 31003, 31004, 31005, 31006, 31007, 31008, 31009, 31010, 31012, 31013, 31014, 31015, 31016, 31017, 31018, 31019, 31020, 31021, 31022]
    },
    {
      count: 0,
      treatments: [31277, 31194, 31258]
    },
    {
      count: 0,
      treatments: [31233, 30064]
    }
  ]

  for(const supplement of supplements){
    let addSupplement = true

    for(const group of groups){
      if(group.treatments.includes(supplement.treatmentId)){
        group.count++

        if(group.count > 1){
          addSupplement = false
        }
      }
    }

    if(addSupplement){
      supplementsOut.push(supplement)
    }
  }

  return supplementsOut
}

function mergeSimilarTreatments(supplements: any[], treatmentsMaster: any[]) {
  const similarTreatments:any[] = [{
    treatments: [30000, 30001, 30002, 30003, 30004, 30007, 31228, 31247],
    count: 0,
    convertTo: 31247,
    requiresConvertion: false
  },
  {
    treatments: [30501, 30500, 31206],
    count: 0,
    convertTo: 31206,
    requiresConvertion: false
  },
  {
    treatments: [30867, 30868, 30869, 30875, 30879, 30881, 30882, 30884, 30890, 31392,30871, 30872, 30874, 30877, 30880, 30888, 31393, 31198],
    count: 0,
    convertTo: 31198,
    requiresConvertion: false
  }
]

  for(const supplement of supplements){
    for(const similarTreatment of similarTreatments){
      if(similarTreatment.treatments.includes(supplement.treatmentId)){
        similarTreatment.count++
      }
    }
  }

  for(const similarTreatment of similarTreatments){
    if(similarTreatment.count > 1){
      similarTreatment.requiresConvertion = true
    }
  }

  for(const similarTreatment of similarTreatments){
    if(similarTreatment.requiresConvertion){
      const supplementIds = supplements.map((s: any) => s.treatmentId)

      if(!supplementIds.includes(similarTreatment.convertTo)){
        const treatment = treatmentsMaster.find((t: any) => t.treatment_id === similarTreatment.convertTo)

        if(treatment){
          supplements.unshift({
            ...treatment,
            type: treatment?.treatment_type,
            treatment_common_name: treatment?.common_names||treatment?.treatment_name,
            ayurvedic_name: treatment?.ayurvedic_name||treatment?.common_names||treatment?.treatment_name,
            chinese_name: treatment?.chinese_name||treatment?.common_names||treatment?.treatment_name,
            constitution: (treatment?.constitution??'').split(',').map((c: any) => +c.trim()).filter((c: any) => !!c),
            ayurvedic_description: treatment?.ayurvedic_description??'',
            chinese_description: treatment?.chinese_description??'',
            symptomsAndConditions: [],
            articles: [],
            totalArticles: 0,
            treatmentInformationItems: []
          })
        }
      }

      const supplementTarget = supplements[supplements.findIndex((s: any) => s.treatment_id === similarTreatment.convertTo)]

      if(supplementTarget){
        for(const supplement of supplements){
          if(similarTreatment.treatments.includes(supplement.treatmentId) && (supplement.treatmentId !== similarTreatment.convertTo)){
            supplementTarget.symptomsAndConditions.push(...supplement.symptomsAndConditions)
            supplementTarget.articles.push(...supplement.articles)            
            supplementTarget.totalArticles = supplementTarget.articles.length
            supplementTarget.treatmentInformationItems.push(...supplement.treatmentInformationItems)            
          }
        }

        supplementTarget.symptomsAndConditions = _.uniqBy(supplementTarget.symptomsAndConditions,'id')
        supplementTarget.treatmentInformationItems = _.uniqBy(supplementTarget.treatmentInformationItems,'id')
      }   

      supplements = supplements.filter((s: any) => !similarTreatment.treatments.includes(s.treatmentId) || (s.treatmentId === similarTreatment.convertTo))
    }
  }
  
  return supplements
}

function buildTreatmentInformationItems(treatment:any, symptomsTreatments: any[], userSymptomsAndConditions: number[]){
  let filteredSymptomsTreatments = symptomsTreatments.filter((st: any) => (st.treatment_id === treatment.treatmentId) && ((!st.symptom_id) || (userSymptomsAndConditions?.includes(st.symptom_id))) && ((!st.condition_id) || (userSymptomsAndConditions?.includes(st.condition_id))))
  
  filteredSymptomsTreatments = filteredSymptomsTreatments.filter((st: any) => ((st.symptom_id || st.condition_id) && st.summarized_data && (st?.summarized_data?.key_roles?.length || st?.summarized_data?.expected_improvement?.length)))

  filteredSymptomsTreatments = filteredSymptomsTreatments.map((st: any) => ({
    ...st,
    symptomConditionNames: (st?.condition_name??'') + (st?.symptom_name??'')
  }))

  filteredSymptomsTreatments = _.uniqBy(filteredSymptomsTreatments, 'symptomConditionNames')

  for(const filteredSymptomsTreatment of filteredSymptomsTreatments){
    if(filteredSymptomsTreatment.summarized_data.key_roles?.length && !Array.isArray(filteredSymptomsTreatment.summarized_data.key_roles)){
      filteredSymptomsTreatment.summarized_data.key_roles = filteredSymptomsTreatment.summarized_data.key_roles.replace(/\ +\[\d+\]/g,'')

      if(filteredSymptomsTreatment.summarized_data.key_roles.includes('.pdf')){
        filteredSymptomsTreatment.summarized_data.key_roles = (filteredSymptomsTreatment.summarized_data.key_roles.split('.pdf')[0]).split('.').slice(0,-1).join('. ')
      }
    }

    if(filteredSymptomsTreatment.summarized_data.expected_improvement?.length && !Array.isArray(filteredSymptomsTreatment.summarized_data.expected_improvement)){
      filteredSymptomsTreatment.summarized_data.expected_improvement = filteredSymptomsTreatment.summarized_data.expected_improvement.replace(/\ +\[\d+\]/g,'')

      if(filteredSymptomsTreatment.summarized_data.expected_improvement.includes('.pdf')){
        filteredSymptomsTreatment.summarized_data.expected_improvement = (filteredSymptomsTreatment.summarized_data.expected_improvement.split('.pdf')[0]).split('.').slice(0,-1).join('. ')
      }
    }

    if(filteredSymptomsTreatment.summarized_data.dosage?.length && !Array.isArray(filteredSymptomsTreatment.summarized_data.dosage)){
      filteredSymptomsTreatment.summarized_data.dosage = filteredSymptomsTreatment.summarized_data.dosage.replace(/\ +\[\d+\]/g,'')

      if(filteredSymptomsTreatment.summarized_data.dosage.includes('.pdf')){
        filteredSymptomsTreatment.summarized_data.dosage = (filteredSymptomsTreatment.summarized_data.dosage.split('.pdf')[0]).split('.').slice(0,-1).join('. ')
      }
    }
    
  }

  return filteredSymptomsTreatments
}

async function getForbiddenArticles() {
  return ((await MedicineArticlesForbidden.findAll({
    raw: true,   
  }))??[]).map((medicineArticleForbidden: any) => +medicineArticleForbidden.pubmed_id)
}

function filterForbiddenArticles(articles:any[], medicineArticlesForbidden: number[]) {
  return articles.filter((a: any) => !medicineArticlesForbidden.includes(+a.articlePubmedId))
}

function mergeArticles(treatment:any) {
  let articles:any = []

  for (const symptomAndCondition of treatment.symptomsAndConditions) {
    for (const article of (symptomAndCondition.articles??[])) {
      let a:any = articles.find((a: any) => a.articlePubmedId === article.articlePubmedId)

      if (!a) {
        a = {...article}
        a.symptomsAndConditions = []
        articles.push(a)
      }

      a.symptomsAndConditions.push(symptomAndCondition?.symptom_name)
    }
  }

  articles = articles.sort((a: any, b: any) => {
    return b.symptomsAndConditions.length - a.symptomsAndConditions.length
  })
  
  return articles
}

function populateSymptomAndCondition(symptomsAndConditions: number[], symptomsTreatments: any[], symptomsById: any, treatmentId: number) {
  return symptomsAndConditions.map((s: any) => ({
    ...symptomsById[+s],
    articles: symptomsTreatments
      .filter(
        (st: any) =>
            (st.treatment_id === treatmentId ) &&
          ((st.symptom_id === +s && !st.condition_id) ||
          (st.condition_id === +s && !st.symptom_id) ||
          (st.symptom_id === +s && symptomsAndConditions?.includes(st.condition_id)))
      )
      .map((st: any) => st.articles)
      .flat(),
  }))
}

export { getSmartRecommendation6 }
