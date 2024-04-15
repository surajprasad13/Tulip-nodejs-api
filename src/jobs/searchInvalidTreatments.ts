import config from '../config'
import SymptomMaster from '../models/masters/symptom_master'
import TreatmentMaster from '../models/masters/treatment_master'
import MedicineArticles from '../models/medicine_articles'
import SymptomTreatments from '../models/symptom_treatments'
import axios from 'axios'
const fs = require('fs')

export async function searchInvalidTreatments() {
  // if (config.NODE_ENV !== 'qa') {
  //   console.log('NOT QA ENV')
  //   return
  // }

  // console.log('searchInvalidTreatments - QA ENV')

  // let symptomTreatments =
  //   (await SymptomTreatments.findAll({
  //     raw: true,
  //   })) ?? []

  //   // await loadValidArticlesCounter(symptomTreatments)

  //   symptomTreatments = await setSourceAndIsValid(symptomTreatments)

  //   await exportInvalidTreatmentRecommendations(symptomTreatments)
  //   await exportInvalidSymptoms(symptomTreatments)
  //   await exportArticlesRejectedByIsQuality(symptomTreatments)
}

async function setSourceAndIsValid(symptomTreatments: any[]){
  const treatmentsMaster = (await TreatmentMaster.findAll({raw: true})) ?? []
  const symptomsMaster = (await SymptomMaster.findAll({raw: true})) ?? []

  for(const symptomTreatment of symptomTreatments){
    const treatmentMaster = treatmentsMaster.find((treatmentMaster: any) => +treatmentMaster.treatment_id === +symptomTreatment.treatment_id)
    const symptomMaster = symptomsMaster.find((symptomMaster: any) => +symptomMaster.symptom_id === +symptomTreatment.symptom_id)

    if(!treatmentMaster){
      symptomTreatment.toBeRemoved = true
      console.log(`treatmentMaster not found for treatment_id: ${symptomTreatment.treatment_id} - ${symptomTreatment.treatment_name}`);      
      continue
    }

    if(!symptomMaster){
      symptomTreatment.toBeRemoved = true
      console.log(`symptomMaster not found for symptom_id: ${symptomTreatment.symptom_id} - ${symptomTreatment.symptom_name}`);
      continue
    }

    symptomTreatment.isValid = ((symptomTreatment?.key_roles?.length || symptomTreatment?.expected_improvement?.length)) && (symptomTreatment?.valid_articles_counter > 0)

    if(symptomTreatment?.custom_recommendations_id){
      symptomTreatment.source = 'custom_recommendations'
    }

    if(symptomTreatment?.symptom_treatments_pdf_id){
      symptomTreatment.source = 'symptom_treatments_pdf'
    }

    if(!symptomTreatment?.custom_recommendations_id && !symptomTreatment?.symptom_treatments_pdf_id && symptomTreatment?.articles?.length){
      symptomTreatment.source = 'articles'
    }

    if(!symptomTreatment.source){
      console.log(`symptomTreatment.source not found for treatment_id: ${symptomTreatment.id}`);      
    }

    symptomTreatment.type = []

    if((treatmentMaster?.treatment_type??'').toLowerCase().includes('vitamin') || (treatmentMaster?.treatment_type??'').toLowerCase().includes('herb') ) {
      symptomTreatment.type.push('supplement')
    }
    
    if((treatmentMaster?.treatment_type??'').toLowerCase().includes('food')) {
      symptomTreatment.type.push('food')
    }

    if((treatmentMaster?.treatment_type??'').toLowerCase().includes('lifestyle')) {
      symptomTreatment.type.push('lifestyle')
    }

    symptomTreatment.type = symptomTreatment.type.join(',')
  }

  return symptomTreatments.filter((symptomTreatment: any) => !symptomTreatment.toBeRemoved)
}


async function exportInvalidSymptoms(symptomTreatments: any[]){
  const symptomsMaster = ((await SymptomMaster.findAll({raw: true})) || []).map((symptomMaster: any) => ({
    ...symptomMaster,
    treatments: {
      supplements: 0,
      food: 0,
      lifestyle: 0,
    }
  }))

  for(const symptom of symptomsMaster){
    const treatments = symptomTreatments.filter((symptomTreatment: any) => symptomTreatment.symptom_id === symptom.symptom_id)

    for(const treatment of treatments){
      if(treatment?.isValid){
        if((treatment?.type??'').includes('supplement')){
          symptom.treatments.supplements++
        }

        if((treatment?.type??'').includes('food')){        
          symptom.treatments.food++
        }

        if((treatment?.type??'').includes('lifestyle')){          
          symptom.treatments.lifestyle++
        }
      }
    }
  }

  console.log(`TOTAL SYMPTOMS: ${symptomsMaster?.length}`);

  const invalidSymptoms = symptomsMaster.filter((symptomMaster: any) => (symptomMaster.treatments.supplements < 3) || (symptomMaster.treatments.food < 2) || (symptomMaster.treatments.lifestyle < 1))

  console.log(`INVALID SYMPTOMS: ${invalidSymptoms?.length}`);

  const jsonObj = invalidSymptoms.map((symptomMaster: any) => ({
    symptom: symptomMaster.symptom_name,
    supplements: symptomMaster.treatments.supplements,
    food: symptomMaster.treatments.food,
    lifestyle: symptomMaster.treatments.lifestyle,
  }))

  jsonToCsv('invalid_symptoms.csv', jsonObj)
}

async function exportInvalidTreatmentRecommendations(symptomTreatments: any[]){
  const invalidTreatmentRecommendations = symptomTreatments.filter((symptomTreatment: any) => !symptomTreatment.isValid)

  console.log(`exportInvalidTreatmentRecommendations - ${invalidTreatmentRecommendations?.length}`);

  let sourceArticles = 0
  let sourceCustomRecommendations = 0
  let sourceSymptomTreatmentPDF = 0

  for(const treatment of invalidTreatmentRecommendations){
    if(treatment.source === 'articles'){
      sourceArticles++
    }

    if(treatment.source === 'custom_recommendations'){
      sourceCustomRecommendations++
    }

    if(treatment.source === 'symptom_treatments_pdf'){
      sourceSymptomTreatmentPDF++
    }
  }

  console.log(`sourceArticles - ${sourceArticles}`);
  console.log(`sourceCustomRecommendations - ${sourceCustomRecommendations}`);
  console.log(`sourceSymptomTreatmentPDF - ${sourceSymptomTreatmentPDF}`);
  
  const jsonObj = invalidTreatmentRecommendations.map((symptomTreatment: any) => ({
    symptom: symptomTreatment.symptom_name,
    treatment: symptomTreatment.treatment_name,
    treatment_type: symptomTreatment.type,
    source: symptomTreatment.source,
    key_roles: !!symptomTreatment.key_roles?.length,
    expected_improvement: !!symptomTreatment.expected_improvement?.length,
    valid_articles: symptomTreatment.valid_articles_counter,
    is_quality_rejected_articles: symptomTreatment.is_quality_rejected_articles,
  }))
  
  jsonToCsv('invalid_treatment_recommendations.csv', jsonObj)
}

async function exportArticlesRejectedByIsQuality(symptomTreatments: any[]){
  const invalidTreatmentRecommendations = symptomTreatments.filter((symptomTreatment: any) => !symptomTreatment.isValid && symptomTreatment?.is_quality_rejected_articles?.length)

  const rejectedArticles = []

  for(const treatment of invalidTreatmentRecommendations){
    for(const pubmedId of (treatment.is_quality_rejected_articles??'')?.split(',').map((article: string) => +article.trim())){
      const article = treatment.articles.find((article: any) => +article.articlePubmedId === +pubmedId)

      if(article){
        rejectedArticles.push({
          symptom: treatment.symptom_name,
          treatment: treatment.treatment_name,
          pubmed_id: article.articlePubmedId,
          title: article.articleTitle,
          url: article.articleUrl,
        })
      }
    }
 

  }
  
  
  jsonToCsv('articles_rejected_by_is_quality.csv', rejectedArticles)
}

function jsonToCsv(filename: string, jsonObj: any){
	const headers = Object.keys(jsonObj[0]);
	const csvData = jsonObj.map((obj: any) => headers.map(header => obj[header]).join('|'));
	csvData.unshift(headers.join('|'));
  
	fs.writeFileSync(filename, csvData.join('\n'));
}


async function loadValidArticlesCounter(symptomTreatments: any[]) {
    let count = 0
  for (const symptomTreatment of symptomTreatments) {
    console.log(`loadValidArticlesCounter - ${count}/${symptomTreatments?.length}` )
    count++

    let validArticlesCounter = 0
    let rejectedArticles = []

    for (const article of symptomTreatment.articles ?? []) {
      if (article?.isOwn === true) {
        validArticlesCounter++
      } else {
        let medicineArticle = await MedicineArticles.findOne({
          where: { pubmed_id: article.articlePubmedId },
          raw: true,
        })
        if (medicineArticle) {
          if (
            await isQualityArticle(
              (medicineArticle?.symptoms ?? '') +
                ' ' +
                (medicineArticle?.preconditions ?? '') +
                ' ' +
                (medicineArticle?.short_text ?? ''),
                +article.articlePubmedId
            )
          ) {
            validArticlesCounter++
          }
          else{
            rejectedArticles.push(medicineArticle?.pubmed_id)
          }
        }
      }
    }

    symptomTreatment.valid_articles_counter = validArticlesCounter

    await SymptomTreatments.update(
      {
        valid_articles_counter: symptomTreatment.valid_articles_counter,
        is_quality_rejected_articles: rejectedArticles.join(','),
      },
      {
        where: {
          id: symptomTreatment.id,
        },
      }
    )
  }
}

function isQualityArticleManualApproved(pubmedId: number) {
  return [
    4030259, 4802122, 4802122, 9907795, 9742665, 7837859, 6116079, 1810369, 9395797, 9395797, 6750292, 6795685, 9053112,
    9335434, 7071190, 6970409, 6468114, 6468114, 5371561, 7235941, 9511160, 6894190, 5563905, 6867972, 6500245, 4018590,
    9668876, 9668876, 9668876, 9668876, 7235941, 4802122, 8225117, 5762694, 8131369, 9778432, 3789131, 9778432, 6385141,
    6385141, 5988048, 9547124, 9896358, 6795685, 9896358, 6795685, 6064756, 6064756, 6064756, 9858974, 6795685, 4894832,
  ].includes(pubmedId)
}

async function isQualityArticle(all_text: string, pubmedId: number) {
  if (pubmedId && isQualityArticleManualApproved(pubmedId)) {
    return true
  }

  try {
    const result = await axios.post(
      'https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/data-models/is-quality',
      { all_text }
    )

    if (result.data?.is_quality !== undefined && result.data?.is_quality !== null) {
      return result.data?.is_quality === true
    }
  } catch (e) {
    console.log('isQualityArticle error:')
    console.log(e)
  }

  return true
}
