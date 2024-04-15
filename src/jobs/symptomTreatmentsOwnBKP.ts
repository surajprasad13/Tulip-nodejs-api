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

export async function symptomTreatmentsOwn() {
  if (
    config.NODE_ENV !== 'qa'
  ) {
    console.log('NOT QA ENV');
    return
  }

  console.log('symptomTreatmentsOwn - QA ENV')

  let symptomTreatmentsCreated = 0

  const articles = await MedicineArticlesProcessedOwn.findAll({
    raw: true,
    where: {
      is_accepted: true,
    },
  })

  const symptomTreatments = (await SymptomTreatments.findAll({
    raw: true,    
  })??[])

  const symptoms = await SymptomMaster.findAll({ raw: true })
  const treatments = await TreatmentMaster.findAll({ raw: true })

  for (const article of articles) {
    console.log('article.id: ', article.id);
    
    for (const symptomArticleName in article?.gpt?.symptoms ?? {}) {
      for (const treatmentArticle of article?.gpt?.symptoms[symptomArticleName] ?? []) {
        
          const symptom = symptoms.find((symptom: any) => symptom.symptom_name === symptomArticleName)
          if (symptom) {
            const treatment = treatments.find(
              (treatment: any) => treatment.treatment_name === treatmentArticle?.treatment
            )

            if (treatment) {
              const symptomTreatment = symptomTreatments.find((symptomTreatment: any) => symptomTreatment.symptom_id === symptom.symptom_id && symptomTreatment.treatment_id === treatment.treatment_id)

              if(symptomTreatment){
                if(symptomTreatment?.articles?.length){
                  symptomTreatment.articles = symptomTreatment.articles.filter((a: any) => +a.articlePubmedId !== +article.pubmed_id)

                  symptomTreatment.articles.push({
                    articleId: article.id,
                    articleTitle: article.title,
                    articleUrl: article.url,
                    articlePubmedId: article.pubmed_id,
                    treatment: treatmentArticle,
                    isOwn: true
                  })
                }
                else{
                  symptomTreatment.articles = [{
                    articleId: article.id,
                    articleTitle: article.title,
                    articleUrl: article.url,
                    articlePubmedId: article.pubmed_id,
                    treatment: treatmentArticle,
                    isOwn: true
                  }]
                }

                await SymptomTreatments.update(
                  {
                    articles: symptomTreatment.articles
                  },
                  {
                    where: {
                      id: symptomTreatment.id,
                    },
                  }
                )
              }
              else{
                symptomTreatmentsCreated++

                await SymptomTreatments.create({
                  symptom_id: symptom.symptom_id,
                  symptom_name: symptom.symptom_name,
                  treatment_id: treatment.treatment_id,
                  treatment_name: treatment.treatment_name,
                  symptom_foods_id: null,
                  symptom_treatments_pdf_id: null,
                  key_roles: treatmentArticle?.keyRoles??null,
                  dosage: treatmentArticle?.recommendedDosage??null,
                  expected_improvement: treatmentArticle?.howMuch??null,
                  articles: [{
                    articleId: article.id,
                    articleTitle: article.title,
                    articleUrl: article.url,
                    articlePubmedId: article.pubmed_id,
                    treatment: treatmentArticle,
                    isOwn: true
                  }],
                  treatmentDescriptionSummary: {
                    keyRoles: null,
                    dosage: null,
                    expectedImprovement: null,
                  },
                  errors: [],
                })

                console.log('symptomTreatmentsCreated: ', symptomTreatmentsCreated);
              }
            }
          }
        
      }
    }
  }

  console.log('symptomTreatmentsOwn - DONE');
  

  
}
