import { symptoms } from './../../jobs/symptoms';
import { Request, Response } from 'express'
import SymptomTreatments from '../../models/symptom_treatments';
import SymptomTreatmentsOwn from '../../models/symptom_treatments_own';
import { Op } from "sequelize"

import * as _ from 'lodash'
import MedicineArticlesApprovedShortText from '../../models/medicine_articles_approved_short_text';
import MedicineArticlesForbidden from '../../models/medicine_articles_forbidden';

const getSymptomTreatmentsData = async (req: Request, res: Response) => {
    try {
      let { symptom_ids, treatment_id } = req.body
      
      return res.json((await loadArticleShortText(((await getSymptomsTreatments())??[]).filter((st: any) => (st.treatment_id === treatment_id) && (
        ((symptom_ids??[]).includes(st.symptom_id) && (symptom_ids??[]).includes(st.condition_id)) ||
        ((symptom_ids??[]).includes(st.symptom_id) && !st.condition_id) ||
        ((!st.symptom_id && (symptom_ids??[]).includes(st.condition_id))))))) ?? [])
      
    } catch (error) {
      console.log(error)
  
      res.status(400).send({ error })
    }
  }

  export function findSymptomTreatments(symptom_id:number, conditions_ids: number[] ,symptomsTreatments: any[]){    
    const result = _.uniq([
        ...symptomsTreatments.filter((st: any) => (st.condition_id === symptom_id) && (!st.symptom_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => (st.symptom_id === symptom_id) && (!st.condition_id)).map((st: any) => +st.treatment_id),
        ...symptomsTreatments.filter((st: any) => ((conditions_ids??[]).includes(st.condition_id)) && (st.symptom_id === symptom_id)).map((st: any) => +st.treatment_id),
    ])

    return result
}

  async function getSymptomsTreatments () {
    return ([
      ...((await SymptomTreatments.findAll({ raw: true })) || []),
      ...((await SymptomTreatmentsOwn.findAll({ raw: true })) || []),
    ])
    .map((st: any) => ({
      ...st,
      articles: (st?.articles??[]).map((a: any) => ({
        ...a,
        url: a.url,
        title: a.title,
        articlePubmedId: a.pubmed_id || a.articlePubmedId,
        mainSymptomTreatment: true,
      })),
    }))
  }

  async function loadArticleShortText(symptomTreatments: any[]){
    let pubmed_ids = symptomTreatments??[]

    for(const st of symptomTreatments){
      for(const article of (st.articles??[])){
        if(article?.pubmed_id){
          pubmed_ids.push(+article.pubmed_id)
        }
      }
    }

    pubmed_ids = _.uniq(pubmed_ids)

    const forbiddenArticles = (await MedicineArticlesForbidden.findAll({
      where: {
        pubmed_id: {
          [Op.in]: pubmed_ids,
        }
      },
      raw: true,	
    })).map((fa: any) => fa.pubmed_id)

    pubmed_ids = _.difference(pubmed_ids, forbiddenArticles)
          

    let shortText = await MedicineArticlesApprovedShortText.findAll({
      where: {
        pubmed_id: {
          [Op.in]: pubmed_ids,
        }
      },
      raw: true,	
    })
    
    return symptomTreatments.map((st: any) => ({
      ...st,
      articles: (st?.articles??[]).map((a: any) => ({
        ...a,
        shortText: shortText.find((st: any) => +st.pubmed_id === +a.pubmed_id)?.short_text || a?.title || '',
      })),
    }))
  }
  



export { getSymptomTreatmentsData }