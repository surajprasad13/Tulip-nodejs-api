import { symptoms } from './symptoms'
import MedicineArticles from '../models/medicine_articles'
import * as _ from 'lodash'
import MedicineArticlesProcessed from '../models/medicine_articles_processed'
import config from '../config'
import { Op, Sequelize } from 'sequelize'

export async function updateMedicineArticlesProcessed() {
  if (
    config.NODE_ENV !== 'qa'    
  ) {
    console.log('NOT QA ENV');
    return
  }

  console.log('QA ENV');

  //await migrateGPT4()

  //await gpt3ConsistencyCheck()

  await gpt3Move()

  // const yesterday = new Date();
  // yesterday.setDate(yesterday.getDate() - 1); // Get yesterday's date

  // const medicineArticles = await MedicineArticles.findAll({
  //   raw: true,
  //   attributes: [
  //     'id',
  //     'pubmed_id',
  //     'title',
  //     'publication_date',
  //     'url',
  //     'is_analyzed',
  //     'analyze_start_date',
  //     'analyze_finish_date',
  //     'gpt',
  //   ],
  //   where: {
  //     //is_analyzed: 4,
  //     analyze_finish_date: {
  //       [Op.gte]: yesterday,
  //     }
  //   },
  // })

  // for (const article of medicineArticles) {
  //   const ageGroupRange = buildAgeGroup(article?.gpt?.age)
  //   const gender = buildGender(article?.gpt?.gender)

  //   const processedArticle: any = {
  //     pubmed_id: article.pubmed_id,
  //     title: article.title ?? null,
  //     publication_date: article.publication_date ?? null,
  //     url: article.url ?? null,
  //     analyze_start_date: article.analyze_start_date ?? null,
  //     analyze_finish_date: article.analyze_finish_date ?? null,
  //     gpt: article.gpt ?? null,
  //     symptoms: null,
  //     treatments: null,
  //     preconditions: null,
  //     min_age_group_range: ageGroupRange?.min ?? null,
  //     max_age_group_range: ageGroupRange?.max ?? null,
  //     gender: gender ?? null,
  //     study_type: null,
  //     is_accepted: article?.gpt?.status ? article?.gpt?.status === 'accepted' : null,
  //   }

  //   if(processedArticle?.gpt?.previousGPT){
  //     delete processedArticle.gpt.previousGPT
  //   }

  //   if (article.gpt?.isRCT) {
  //     processedArticle.study_type = 'RCT'
  //   }

  //   if (article.gpt?.isQualitative) {
  //     processedArticle.study_type = 'QUALITATIVE'
  //   }

  //   if (article.gpt?.isCohort) {
  //     processedArticle.study_type = 'COHORT'
  //   }

  //   if (article.gpt?.isCaseControl) {
  //     processedArticle.study_type = 'CASE_CONTROL'
  //   }

  //   const symptoms: string[] = []
  //   const treatments: string[] = []
  //   const preconditions: string[] = []

  //   for (const symptom in article?.gpt?.symptoms ?? {}) {
  //     symptoms.push(symptom)

  //     for (const treatment of article.gpt.symptoms[symptom]) {
  //       treatments.push(treatment.treatment)
  //       preconditions.push(...(treatment.preconditions ?? []))
  //     }
  //   }

  //   if (symptoms.length) {
  //     processedArticle.symptoms = _.uniq(symptoms).join(',')
  //   }

  //   if (treatments?.length) {
  //     processedArticle.treatments = _.uniq(treatments).join(',')
  //   }

  //   if (preconditions?.length) {
  //     processedArticle.preconditions = _.uniq(preconditions).join(',')
  //   }

  //   await upsertMedicineArticleProcessed(processedArticle)
  // }

  // console.log('updateMedicineArticlesProcessed: ', medicineArticles.length)
}

async function gpt3Move(){
  const medicineArticlesProcessed = (await MedicineArticlesProcessed.findAll({
    raw: true,
    attributes: [
      'id',
      'pubmed_id',
      'gpt',      
    ],        
  })??[])

  for(const articleProcessed of medicineArticlesProcessed){
    await MedicineArticles.update({
      gpt: articleProcessed.gpt
    }, {
      where: {
          pubmed_id: articleProcessed.pubmed_id,
      },
    })
  }
}

async function gpt3ConsistencyCheck(){
  const medicineArticles = (await MedicineArticles.findAll({
    raw: true,
    attributes: [
      'id',
      'pubmed_id',
      'symptoms',
      'treatments'
    ],        
  })??[]).map((article:any)=> ({
    ...article,
    symptoms: (article?.symptoms??'').split(',').map((symptom:string)=>symptom.trim().toLowerCase()).filter((symptom:string)=>symptom.length),
    treatments: (article?.treatments??'').split(',').map((treatments:string)=>treatments.trim().toLowerCase()).filter((treatments:string)=>treatments.length),
  }))

  const medicineArticlesProcessed = (await MedicineArticlesProcessed.findAll({
    raw: true,
    attributes: [
      'id',
      'pubmed_id',
      'gpt',      
    ],        
  })??[])

  const inconsistentArticles:any[] = []
  const notfoundArticles:any[] = []
  const foundArticles:any[] = []

  for(const articleProcessed of medicineArticlesProcessed){
    const medicineArticle = medicineArticles.find((article:any)=> +article.pubmed_id === +articleProcessed.pubmed_id)

    if(!medicineArticle){
      notfoundArticles.push(+articleProcessed.pubmed_id)
      //console.log(`article not found: ${articleProcessed.pubmed_id}`);
      continue
    }

    foundArticles.push(+articleProcessed.pubmed_id)

    if(!articleProcessed?.gpt?.symptoms && Object.keys(articleProcessed?.gpt?.symptoms).length){
      for(const symptom in articleProcessed?.gpt?.symptoms){
        if(!medicineArticle.symptoms.includes(symptom.trim().toLowerCase())){
          console.log(`symptom not found: ${articleProcessed.pubmed_id}, ${symptom}`);
          inconsistentArticles.push(+articleProcessed.pubmed_id)
        }

        for(const treatment of (articleProcessed?.gpt?.symptoms[symptom]??[])){
          if(!medicineArticle.treatments.includes(treatment.treatment.trim().toLowerCase())){
            console.log(`treatment not found: ${articleProcessed.pubmed_id}, ${treatment.treatment}`);
            inconsistentArticles.push(+articleProcessed.pubmed_id)
          }
        }
      }
    }
  }

  console.log(`inconsistentArticles: ${_.uniq(inconsistentArticles).length}`);
  console.log(`foundArticles: ${_.uniq(foundArticles).length}`);
  console.log(`notfoundArticles: ${_.uniq(notfoundArticles).length}`);
}

async function migrateGPT4(){
  const medicineArticlesGP4Accepted = await MedicineArticles.findAll({
    raw: true,
    attributes: [
      'id',
      'pubmed_id',
      'gpt4',
    ],    
    where: Sequelize.where(Sequelize.fn('JSON_EXTRACT', Sequelize.col('gpt4'), Sequelize.literal(`'$.status'`)), '=', 'accepted')    
  })

  for(const article of medicineArticlesGP4Accepted){
    if(article?.gpt4?.previousGPT){
      delete article.gpt4.previousGPT
    }

    await MedicineArticlesProcessed.update({
      gpt4: article.gpt4
    }, {
      where: {
          pubmed_id: article.pubmed_id,
      },
  })
  }
}

async function cleanPreviousGPT(){
  const articles = await MedicineArticlesProcessed.findAll({
    raw: true,
    where: Sequelize.where(Sequelize.fn('JSON_EXTRACT', Sequelize.col('gpt'), Sequelize.literal(`'$.previousGPT'`)), '<>', Sequelize.cast('null', 'JSON')),
  })

  for(const article of articles){
    if(article?.gpt?.previousGPT){
      delete article.gpt.previousGPT
    }

    await MedicineArticlesProcessed.update({
      gpt: article.gpt
    }, {
      where: {
        id: article.id
      }
    })

  }

  console.log(`cleanPreviousGPT: ${articles.length}`);
}

async function upsertMedicineArticleProcessed(article: any) {
  const processedArticle = await MedicineArticlesProcessed.findOne({
    raw: true,
    where: {
      pubmed_id: article.pubmed_id,
    },
  })

    if (processedArticle) {
        await MedicineArticlesProcessed.update(article, {
            where: {
                pubmed_id: article.pubmed_id,
            },
        })
    } else {
        await MedicineArticlesProcessed.create(article)
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