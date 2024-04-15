import config from '../config'
import MedicineArticles from '../models/medicine_articles'
import { Op, Sequelize } from 'sequelize'
import SymptomConditionMaster from '../models/symptom_condition_master'
import TreatmentMaster from '../models/masters/treatment_master'
import * as _ from 'lodash'
import SymptomTreatments from '../models/symptom_treatments'
import SymptomTreatmentsHumata from '../models/symptom_treatments_humata'
import HealthLineArticles from '../models/healthline_articles'

const fs = require('fs');

let articlesNotFoundSymptoms: string[] = []
let articlesNotFoundTreatments: string[] = []
let humataNotFoundSymptoms: string[] = []
let humataNotFoundTreatments: any[] = []
let symptomTreatmentsUpdated = 0
let symptomTreatmentsCreated = 0

export async function symptomTreatments() {
  if (config.NODE_ENV !== 'dev') {
    console.log('NOT QA ENV')
    return
  }

  console.log('symptomTreatments - QA ENV')

  let symptomsAndTreatments: any[] = []

  const indexedSymptoms = await getIndexedSymptoms()
  const indexedTreatments = await getIndexedTreatments()

  // symptomsAndTreatments = await getSymptomsAndTreatmentsFromArticles(
  //   symptomsAndTreatments,
  //   indexedSymptoms,
  //   indexedTreatments
  // )

  symptomsAndTreatments = await getSymptomsAndTreatmentsFromHealthlineArticles(
    symptomsAndTreatments,
    indexedSymptoms,
    indexedTreatments
  )

  // symptomsAndTreatments = await getSymptomsAndTreatmentsFromHumata(
  //   symptomsAndTreatments,
  //   indexedSymptoms,
  //   indexedTreatments
  // )

  await upsertSymptomsAndTreatments(symptomsAndTreatments)

  console.log('symptomsTreatments DONE')

  // articlesNotFoundSymptoms = _.uniq(articlesNotFoundSymptoms)
  // articlesNotFoundTreatments = _.uniq(articlesNotFoundTreatments)
  // humataNotFoundSymptoms = _.uniq(humataNotFoundSymptoms)
  

  // console.log(`articlesNotFoundSymptoms: ${articlesNotFoundSymptoms}`);
  // console.log(`articlesNotFoundTreatments: ${articlesNotFoundTreatments}`);
  // console.log(`humataNotFoundSymptoms: ${humataNotFoundSymptoms}`);
  


  // console.log(articlesNotFoundSymptoms.join(', '))
  // console.log(articlesNotFoundTreatments.join(', '))
  // console.log(humataNotFoundSymptoms.join(', '))
  // console.log(humataNotFoundTreatments.join(', '))

  // humataNotFoundTreatments = humataNotFoundTreatments.sort((a: any, b: any) => b.ocurrencies - a.ocurrencies)
  // humataNotFoundTreatments = humataNotFoundTreatments.map((t: any) => ({ ...t, symptomsAndConditions: _.uniq(t.symptomsAndConditions).filter((s: any) => s?.length > 0).join(', ') }))

  // console.log(humataNotFoundTreatments);

  // jsonToCsv('humataNotFoundTreatments.csv', humataNotFoundTreatments)
}

// function jsonToCsv(filename: string, jsonObj: any[]){
// 	const headers = Object.keys(jsonObj[0]);
// 	const csvData = jsonObj.map((obj: any) => headers.map(header => obj[header]).join('|'));
// 	csvData.unshift(headers.join('|'));
  
// 	fs.writeFileSync(filename, csvData.join('\n'));
// }

async function upsertSymptomsAndTreatments(symptomsAndTreatments: any[]) {
  for (const symptomAndTreatment of symptomsAndTreatments) {
    const existingSymptomTreatment = await SymptomTreatments.findOne({
      where: {
        symptom_id: symptomAndTreatment.symptom_id,
        treatment_id: symptomAndTreatment.treatment_id,
        condition_id: symptomAndTreatment.condition_id,
      },
    })

    if (existingSymptomTreatment) {
      await SymptomTreatments.update(
        {
          articles: _.uniqBy([...(symptomAndTreatment.articles??[]), ...(existingSymptomTreatment.articles??[])], 'url'),
          // humata: symptomAndTreatment.humata,
          dirty: true,
        },
        {
          where: {
            symptom_id: symptomAndTreatment.symptom_id,
            treatment_id: symptomAndTreatment.treatment_id,
            condition_id: symptomAndTreatment.condition_id,
          },
        }
      )

      symptomTreatmentsUpdated++
    } else {
      await SymptomTreatments.create({
        ...symptomAndTreatment,
        dirty: true,
      })

      symptomTreatmentsCreated++
    }

    console.log(`symptomTreatments job - ${symptomTreatmentsUpdated} updated, ${symptomTreatmentsCreated} created`);
    
  }
}

async function getIndexedSymptoms() {
  const indexedSymptoms: any = {}

  const symptomConditionMaster = await SymptomConditionMaster.findAll({ raw: true })

  for (const symptom of symptomConditionMaster) {
    indexedSymptoms[(symptom.symptom_name ?? '').toLowerCase().trim()] = { ...symptom }
  }

  return indexedSymptoms
}

async function getIndexedTreatments() {
  const indexedTreatments: any = {}

  const treatmentMaster = await TreatmentMaster.findAll({ raw: true })

  for (const treatment of treatmentMaster) {
    indexedTreatments[(treatment.treatment_name ?? '').toLowerCase().trim().replace('extracts','').replace('extract','').replace(/[\’'"`]/g,'')] = { ...treatment }
    indexedTreatments[(treatment.ayurvedic_name ?? '').toLowerCase().trim().replace('extracts','').replace('extract','').replace(/[\’'"`]/g,'')] = { ...treatment }
    indexedTreatments[(treatment.chinese_name ?? '').toLowerCase().trim().replace('extracts','').replace('extract','').replace(/[\’'"`]/g,'')] = { ...treatment }

    for (const synonym of (treatment.gpt_treatment_name ?? '')
    .split(/[,;]/)
    .map((s: string) => s.toLowerCase().trim().replace('extracts','').replace('extract','').replace(/[\’'"`]/g,''))
    .filter((s: string) => s.length > 0)) {
    indexedTreatments[synonym] = { ...treatment }
  }

    for (const synonym of (treatment.treatment_synonyms ?? '')
      .split(/[,;]/)
      .map((s: string) => s.toLowerCase().trim().replace('extracts','').replace('extract','').replace(/[\’'"`]/g,''))
      .filter((s: string) => s.length > 0)) {
      indexedTreatments[synonym] = { ...treatment }
    }

    for (const synonym of (treatment.common_names ?? '')
      .split(/[,;]/)
      .map((s: string) => s.toLowerCase().trim().replace('extracts','').replace('extract','').replace(/[\’'"`]/g,''))
      .filter((s: string) => s.length > 0)) {
      indexedTreatments[synonym] = { ...treatment }
    }

    for (const synonym of (treatment.humata_synonyms ?? '')
    .split(/[,;]/)
    .map((s: string) => s.toLowerCase().trim().replace('extracts','').replace('extract','').replace(/[\’'"`]/g,''))
    .filter((s: string) => s.length > 0)) {
    indexedTreatments[synonym] = { ...treatment }
  }
  }

  return indexedTreatments
}

async function getSymptomsAndTreatmentsFromHumata(
  symptomsAndTreatments: any[],
  indexedSymptoms: any,
  indexedTreatments: any
) {

  await cleanAndParseHumataTreatments()

  const symptomTreatmentsHumata = await SymptomTreatmentsHumata.findAll({ where: { treatments: { [Op.ne]: null } }, raw: true })

  for(const symptomTreatmentHumata of symptomTreatmentsHumata){
    const symptom = indexedSymptoms[(symptomTreatmentHumata.symptom_name??'').toLowerCase().trim()]??null
    const condition = indexedSymptoms[(symptomTreatmentHumata.condition_name??'').toLowerCase().trim()]??null

    if(symptomTreatmentHumata.symptom_name && !symptom){
      humataNotFoundSymptoms.push(symptomTreatmentHumata.symptom_name)
    }

    if(symptomTreatmentHumata.condition_name && !condition){
      humataNotFoundSymptoms.push(symptomTreatmentHumata.condition_name)
    }

    const humataTreatments = [
      ...(symptomTreatmentHumata.treatments?.herb || []),
      ...(symptomTreatmentHumata.treatments?.supplement || []),
      ...(symptomTreatmentHumata.treatments?.modalities_therapies || []),
    ].filter((t: any) => t?.name?.length && t?.type?.length).map((t: any) => ({ ...t, folder: symptomTreatmentHumata.humata_folder }))

    for(const humataTreatment of humataTreatments){
      const cleanedName = humataTreatment.name.replace(/\(.*\)/g,'').replace(/[\’'"`]/g,'').toLowerCase().replace('use of','').replace('consumption of','').replace('administration of','').replace('supplementation','').replace('supplements','').replace('extracts','').replace('extract','').replace('supplement','').trim()

      const treatment = indexedTreatments[cleanedName]

      if(treatment){
        const symptomAndTreatment = findSymptomTreatment(symptomsAndTreatments, symptom, treatment, condition)

        symptomAndTreatment.humata.push(humataTreatment)
      }
      else{
        const humataNotFoundTreatment = humataNotFoundTreatments.find((t: any) => t.name === cleanedName)

        if(humataNotFoundTreatment){
          humataNotFoundTreatment.ocurrencies++
          humataNotFoundTreatment.symptomsAndConditions.push(symptomTreatmentHumata.symptom_name)
          humataNotFoundTreatment.symptomsAndConditions.push(symptomTreatmentHumata.condition_name)
        }
        else{
          humataNotFoundTreatments.push({ name: cleanedName, ocurrencies: 1, symptomsAndConditions: [symptomTreatmentHumata.symptom_name, symptomTreatmentHumata.condition_name] })
        }        
      }
    }
  }

  return symptomsAndTreatments
}

async function cleanAndParseHumataTreatments() {
  const symptomTreatments = await SymptomTreatmentsHumata.findAll({ where: { treatments: { [Op.ne]: null } }, raw: true })

  for(const symptomTreatment of symptomTreatments){
      if(symptomTreatment?.treatments?.herb?.length){
        symptomTreatment.treatments.herb = symptomTreatment.treatments.herb.map((h: any) => h?.type?.length ? h : ({
          original_name: h,
          name: h.replace(/\[[\d,\s]+\]/g,'').split(':')[0].trim(),
          key_roles: null,
          expected_improvement: null,
          dosage: null,
          type: 'herb'
        }))
      }

      if(symptomTreatment?.treatments?.supplement?.length){
        symptomTreatment.treatments.supplement = symptomTreatment.treatments.supplement.map((h: any) => h?.type?.length ? h : ({
          original_name: h,
          name: h.replace(/\[[\d,\s]+\]/g,'').split(':')[0].trim(),
          key_roles: null,
          expected_improvement: null,
          dosage: null,
          type: 'supplement'
        }))
      }

      if(symptomTreatment?.treatments?.modalities_therapies?.length){
        symptomTreatment.treatments.modalities_therapies = symptomTreatment.treatments.modalities_therapies.map((h: any) => h?.type?.length ? h : ({
          original_name: h,
          name: h.replace(/\[[\d,\s]+\]/g,'').split(':')[0].trim(),
          key_roles: null,
          expected_improvement: null,
          dosage: null,
          type: 'modalities_therapies'
        }))
      }     
    
    await SymptomTreatmentsHumata.update({ treatments: symptomTreatment.treatments }, { where: { id: symptomTreatment.id } })
  }
}

async function getSymptomsAndTreatmentsFromArticles(
  symptomsAndTreatments: any[],
  indexedSymptoms: any,
  indexedTreatments: any
) {
  const articles = await getArticles()

  console.log(`symptomTreatments job articles - ${articles?.length} articles`);
  

  for (const article of articles) {
    for (const symptomName in article?.gpt4?.symptoms || {}) {
      const symptom = indexedSymptoms[symptomName.toLowerCase().trim()]
      if (symptom) {
        for (const articleTreatment of article?.gpt4?.symptoms[symptomName] || []) {
          const articleTreatmentGPT3 = (((article?.gpt?.symptoms??{})[symptomName]) || []).find((t: any) => (t.treatment && (t.treatment === articleTreatment?.treatment)))
          const treatmentName = articleTreatment?.treatment?.toLowerCase()?.trim() ?? ''

          const treatment = indexedTreatments[treatmentName]

          if (treatment) {            
            const symptomAndTreatment = findSymptomTreatment(symptomsAndTreatments, symptom, treatment)

            if(!symptomAndTreatment.articles.find((a: any) => +a.pubmed_id === +article.pubmed_id)){
              symptomAndTreatment.articles.push({
                pubmed_id: article.pubmed_id,
                title: article.title,
                url: article.url,
                howMuch: articleTreatment?.howMuch || articleTreatmentGPT3?.howMuch,
                keyRoles: articleTreatment?.keyRoles || articleTreatmentGPT3?.keyRoles,
                recommendedDosage: articleTreatment?.recommendedDosage || articleTreatmentGPT3?.recommendedDosage,
                keyRolesExplanation: articleTreatment?.keyRolesExplanation || articleTreatmentGPT3?.keyRolesExplanation,
                mainSymptomTreatment: articleTreatment?.mainSymptomTreatment,
              })
            }
          } else {
            articlesNotFoundTreatments.push(treatmentName)
          }
        }
      } else {
        articlesNotFoundSymptoms.push(symptomName)
      }
    }

    for (const conditionName in article?.gpt?.symptomsAndConditions || {}) {
      const condition = indexedSymptoms[conditionName.toLowerCase().trim()]

      if(condition){
        for (const symptomName in (article.gpt.symptomsAndConditions[conditionName] || {})) {
          const symptom = indexedSymptoms[symptomName.toLowerCase().trim()]

          if (symptom) {
            for (const articleTreatment of (article?.gpt?.symptomsAndConditions[conditionName][symptomName] || [])) {
              const treatmentName = articleTreatment?.treatment?.toLowerCase()?.trim() ?? ''

              const treatment = indexedTreatments[treatmentName]

              if (treatment && gpt4SymptomConditionTreatmentChecking(article.gpt4, symptomName, conditionName, treatmentName)) {
                const symptomAndTreatment = findSymptomTreatment(symptomsAndTreatments, symptom, treatment, condition)

                if(!symptomAndTreatment.articles.find((a: any) => +a.pubmed_id === +article.pubmed_id)){
                  symptomAndTreatment.articles.push({
                    pubmed_id: article.pubmed_id,
                    title: article.title,
                    url: article.url,
                    howMuch: articleTreatment?.howMuch,
                    keyRoles: articleTreatment?.keyRoles,
                    recommendedDosage: articleTreatment?.recommendedDosage,
                    keyRolesExplanation: articleTreatment?.keyRolesExplanation,
                    mainSymptomTreatment: articleTreatment?.mainSymptomTreatment,
                  })
                }
              } else {
                articlesNotFoundTreatments.push(treatmentName)
              }
            }
          }
          else{
            articlesNotFoundSymptoms.push(symptomName)
          }
        }
      }
      else{
        articlesNotFoundSymptoms.push(conditionName)
      }

    }
  }

  return symptomsAndTreatments
}

async function getSymptomsAndTreatmentsFromHealthlineArticles(
  symptomsAndTreatments: any[],
  indexedSymptoms: any,
  indexedTreatments: any
) {
  const articles = await getHealthlineArticles()

  console.log(`symptomTreatments job healthline articles - ${articles?.length} articles`);
  

  for (const article of articles) {
    for (const symptomName in article?.gpt?.symptoms || {}) {
      const symptom = indexedSymptoms[symptomName.toLowerCase().trim()]
      if (symptom) {
        for (const articleTreatment of article?.gpt?.symptoms[symptomName] || []) {
          const articleTreatmentGPT3 = (((article?.gpt?.symptoms??{})[symptomName]) || []).find((t: any) => (t.treatment && (t.treatment === articleTreatment?.treatment)))
          const treatmentName = articleTreatment?.treatment?.toLowerCase()?.trim() ?? ''

          const treatment = indexedTreatments[treatmentName]

          if (treatment) {            
            const symptomAndTreatment = findSymptomTreatment(symptomsAndTreatments, symptom, treatment)

            if(!symptomAndTreatment.articles.find((a: any) => +a.url === +article.url)){
              symptomAndTreatment.articles.push({
                pubmed_id: null,
                isHealthLine: true,
                title: article.title,
                url: article.url,
                howMuch: articleTreatment?.howMuch || articleTreatmentGPT3?.howMuch,
                keyRoles: articleTreatment?.keyRoles || articleTreatmentGPT3?.keyRoles,
                recommendedDosage: articleTreatment?.recommendedDosage || articleTreatmentGPT3?.recommendedDosage,
                keyRolesExplanation: articleTreatment?.keyRolesExplanation || articleTreatmentGPT3?.keyRolesExplanation,
                mainSymptomTreatment: articleTreatment?.mainSymptomTreatment,
              })
            }
          } else {
            articlesNotFoundTreatments.push(treatmentName)
          }
        }
      } else {
        articlesNotFoundSymptoms.push(symptomName)
      }
    }
  }

  return symptomsAndTreatments
}

function gpt4SymptomConditionTreatmentChecking(gpt4: any, symptom:string, condition:string, treatment:string){
  let foundTreatmentForCondition = false
  let foundTreatmentForSymptom = false

  if((((gpt4?.symptoms??{})[symptom])??[]).find((t: any) => t.treatment === treatment)){
    foundTreatmentForSymptom = true
  }

  if((((gpt4?.symptoms??{})[condition])??[]).find((t: any) => t.treatment === treatment)){
    foundTreatmentForCondition = true
  }

  return foundTreatmentForCondition && foundTreatmentForSymptom
}

function findSymptomTreatment(
  symptomsAndTreatments: any[],
  symptom: any | null = null,
  treatment: any,
  condition: any | null = null
) {
  let symptomAndTreatment = symptomsAndTreatments.find(
    (st) =>
      st.symptom_id === (symptom?.symptom_id??null) &&
      st.treatment_id === (treatment?.treatment_id??null) &&
      st.condition_id === (condition?.symptom_id??null)
  )

  if (symptomAndTreatment) {
    return symptomAndTreatment
  }  

  symptomAndTreatment = {
    symptom_id: symptom?.symptom_id || null,
    symptom_name: symptom?.symptom_name || null,
    treatment_id: treatment?.treatment_id,
    treatment_name: treatment?.treatment_name,
    condition_id: condition?.symptom_id || null,
    condition_name: condition?.symptom_name || null,
    articles: [],
    humata: [],
    summarized_data: null,
    dirty: true,
  }

  symptomsAndTreatments.push(symptomAndTreatment)

  return symptomAndTreatment
}

async function getArticles() {
  return (
    (await MedicineArticles.findAll({
      raw: true,
      attributes: ['pubmed_id', 'title', 'url', 'gpt', 'gpt4'],

      where: Sequelize.where(
        Sequelize.fn('JSON_EXTRACT', Sequelize.col('gpt4'), Sequelize.literal(`'$.status'`)),
        '=',
        'accepted'
      ),
    })) || []
  )
}

async function getHealthlineArticles() {
  return (
    (await HealthLineArticles.findAll({
      raw: true,
      attributes: ['id', 'title', 'url', 'gpt'],
      where: Sequelize.where(
        Sequelize.fn('JSON_EXTRACT', Sequelize.col('gpt'), Sequelize.literal(`'$.status'`)),
        '=',
        'accepted'
      ),
    })) || []
  )
}