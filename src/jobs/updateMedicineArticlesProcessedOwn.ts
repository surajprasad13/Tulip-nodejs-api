import MedicineArticlesOwn from '../models/medicine_articles_own'
import * as _ from 'lodash'
import MedicineArticlesProcessedOwn from '../models/medicine_articles_processed_own'
import config from '../config'

export async function updateMedicineArticlesProcessedOwn() {
  if (
    config.NODE_ENV !== 'qa'    
  ) {
    console.log('NOT QA ENV');
    return
  }

  console.log('QA ENV');

  const medicineArticles = await MedicineArticlesOwn.findAll({
    raw: true,
    attributes: [
      'id',
      'pubmed_id',
      'title',
      'publication_date',
      'url',
      'is_analyzed',
      'analyze_start_date',
      'analyze_finish_date',
      'gpt',
    ], 
  })

  for (const article of medicineArticles) {
    const ageGroupRange = buildAgeGroup(article?.gpt?.age)
    const gender = buildGender(article?.gpt?.gender)

    const processedArticle: any = {
      pubmed_id: article.pubmed_id,
      title: article.title ?? null,
      publication_date: article.publication_date ?? null,
      url: article.url ?? null,
      analyze_start_date: article.analyze_start_date ?? null,
      analyze_finish_date: article.analyze_finish_date ?? null,
      gpt: article.gpt ?? null,
      symptoms: null,
      treatments: null,
      preconditions: null,
      min_age_group_range: ageGroupRange?.min ?? null,
      max_age_group_range: ageGroupRange?.max ?? null,
      gender: gender ?? null,
      study_type: null,
      is_accepted: article?.gpt?.status ? article?.gpt?.status === 'accepted' : null,
    }

    if(processedArticle?.gpt?.previousGPT){
      delete processedArticle.gpt.previousGPT
    }

    if (article.gpt?.isRCT) {
      processedArticle.study_type = 'RCT'
    }

    if (article.gpt?.isQualitative) {
      processedArticle.study_type = 'QUALITATIVE'
    }

    if (article.gpt?.isCohort) {
      processedArticle.study_type = 'COHORT'
    }

    if (article.gpt?.isCaseControl) {
      processedArticle.study_type = 'CASE_CONTROL'
    }

    const symptoms: string[] = []
    const treatments: string[] = []
    const preconditions: string[] = []

    for (const symptom in article?.gpt?.symptoms ?? {}) {
      symptoms.push(symptom)

      for (const treatment of article.gpt.symptoms[symptom]) {
        treatments.push(treatment.treatment)
        preconditions.push(...(treatment.preconditions ?? []))
      }
    }

    if (symptoms.length) {
      processedArticle.symptoms = _.uniq(symptoms).join(',')
    }

    if (treatments?.length) {
      processedArticle.treatments = _.uniq(treatments).join(',')
    }

    if (preconditions?.length) {
      processedArticle.preconditions = _.uniq(preconditions).join(',')
    }

    await upsertMedicineArticleProcessed(processedArticle)
  }

  console.log('updateMedicineArticlesProcessed: ', medicineArticles.length)
}


async function upsertMedicineArticleProcessed(article: any) {
  const processedArticle = await MedicineArticlesProcessedOwn.findOne({
    raw: true,
    where: {
      pubmed_id: article.pubmed_id,
    },
  })

    if (processedArticle) {
        await MedicineArticlesProcessedOwn.update(article, {
            where: {
                pubmed_id: article.pubmed_id,
            },
        })
    } else {
        await MedicineArticlesProcessedOwn.create(article)
    }
}

function buildGender(gender: string){
    if(!gender?.length){
      return null
    }

    if(gender.includes('female') && gender.replace(/female/g,'').includes('male')){    
      return 'both'
    }

    if(gender.includes('female')){      
      return 'female'
    }

    if(gender.includes('male')){
      return 'male'
    }

    if(gender.includes('both')){
      return 'both'
    }

    return null
  }

  function buildAgeGroup(age: string){
    const ageGroupRange:any = {
      min: null,
      max: null,
      text: age
    }

    if(!age?.length){
        return ageGroupRange
    }

    if(age.includes('±') && (age.match(/[\d\.]+.*±.*[\d\.]+/g)?.length === 1)){
      const arr = age.match(/\d+(\.\d+)?/g)

      if((arr?.length === 2) && +arr[0] && +arr[1]){
        age = `${+arr[0] - +arr[1]} - ${+arr[0] + +arr[1]}`
      }
    }

    const agesArr = age.match(/\d+\.?\d*/g)

    if(agesArr?.length === 2){
      if((+agesArr[0] >= 0) && (+agesArr[1] >= 0) && (+agesArr[0] <= +agesArr[1]) && (+agesArr[1] <= 130) && (+agesArr[0] <= 130)){
        ageGroupRange.min = +agesArr[0]
        ageGroupRange.max = +agesArr[1]
      }
    }

    return ageGroupRange
  }