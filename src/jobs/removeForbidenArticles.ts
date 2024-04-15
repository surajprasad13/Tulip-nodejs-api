import config from '../config'
import MedicineArticlesForbidden from '../models/medicine_articles_forbidden'
import SymptomTreatments from '../models/symptom_treatments'

export async function removeForbidenArticles() {
  if (config.NODE_ENV !== 'qa') {
    console.log('NOT QA ENV')
    return
  }

  console.log('removeForbidenArticles - QA ENV')

  let medicineArticlesForbidden = (
    (await MedicineArticlesForbidden.findAll({
      raw: true,
    })) ?? []
  ).map((medicineArticleForbidden: any) => +medicineArticleForbidden.pubmed_id)

  let symptomTreatments =
    (await SymptomTreatments.findAll({
      raw: true,
    })) ?? []

  for (const symptomTreatment of symptomTreatments) {
    symptomTreatment.forbidden_articles = []
    for (const article of symptomTreatment?.articles ?? []) {
      if (medicineArticlesForbidden.includes(+article.articlePubmedId)) {
        symptomTreatment.forbidden_articles.push(article.articlePubmedId)
      }
    }

    if (symptomTreatment.forbidden_articles.length) {
      symptomTreatment.forbidden_articles = symptomTreatment.forbidden_articles.join(',')
    } else {
      symptomTreatment.forbidden_articles = null
    }

    await SymptomTreatments.update(
      {
        forbidden_articles: symptomTreatment.forbidden_articles,
      },
      {
        where: {
          id: symptomTreatment.id,
        },
      }
    )
  }

  console.log('removeForbidenArticles - DONE')
}
