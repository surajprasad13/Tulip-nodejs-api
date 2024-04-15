import config from '../config'
import TreatmentMaster from '../models/masters/treatment_master'
import MedicineArticlesOwn from '../models/medicine_articles_own'
import SymptomConditionMaster from '../models/symptom_condition_master'
import SymptomTreatmentsOwn from '../models/symptom_treatments_own'
import * as _ from 'lodash'

export async function symptomTreatmentsOwn() {
    if (config.NODE_ENV !== 'local') {
      console.log('NOT LOCAL ENV')
      return
    }
  
    console.log('symptomTreatmentsOwn - LOCAL ENV')

    const treatmentMaster = ((await TreatmentMaster.findAll({ 
        raw: true,
      })) || [])

    const symptomsAndConditions = (await SymptomConditionMaster.findAll({ raw: true
    })) || []

  //  await fixIds(treatmentMaster, symptomsAndConditions)

    const symptomTreatmentsOwn = ((await SymptomTreatmentsOwn.findAll({ 
        raw: true,
      })) || [])

    const medicineArticlesOwn = ((await MedicineArticlesOwn.findAll({ 
        raw: true,        
      })) || [])

    const notFoundArticles:string[] = []

    for(const sto of symptomTreatmentsOwn){
        for(const articleUrl of (sto.articles_urls??'').split(';')){
            if(!articleUrl.length){
                continue
            }

            const article = medicineArticlesOwn.find((mao:any) => mao.url === articleUrl)
            
            if(!sto.articles){
                sto.articles = []
            }
            

            if(article){
                const articleInfo = (((article?.gpt?.symptoms||{})[sto.symptom_name || sto.condition_name])??[]).find((ai:any) => ai?.treatment?.trim()?.toLowerCase() === sto?.treatment_name?.trim()?.toLowerCase())

                if(articleInfo){
                    console.log('AAAAA');

                    console.log(articleInfo);
                    
                    
                    sto.articles.push(({
                        url: article.url,
                        title: article.title,
                        howMuch: articleInfo.howMuch,
                        keyRoles: articleInfo.keyRoles,
                        recommendedDosage: articleInfo.recommendedDosage,
                        pubmed_id: article.pubmed_id,
                        keyRolesExplanation: articleInfo.keyRolesExplanation
                    }))

                    console.log('UPDATING  ', sto.id);

                    console.log(sto.articles);
                    
                    

                    await SymptomTreatmentsOwn.update({
                        articles: sto.articles,
                      //  summarized_data: null,
                        // summarized_data: {
                        //     dosage: sto?.dosage || articleInfo?.recommendedDosage,
                        //     key_roles: sto?.key_roles || articleInfo.keyRoles,
                        //     expected_improvement: sto?.expected_improvement || articleInfo.howMuch,
                        // }
                    }, {
                        where: {
                            id: sto.id
                        }
                    })
                }
                else{
                    console.log(`Not found articleInfo for ${sto.symptom_name} - ${sto.treatment_name} - ${article.url}`);
                    
                    await SymptomTreatmentsOwn.update({
                        articles: sto.articles?.length ? sto.articles : null,
                      //  summarized_data: null,
                        // summarized_data: {
                        //     dosage: sto?.dosage || null,
                        //     key_roles: sto?.key_roles || null,
                        //     expected_improvement: sto?.expected_improvement || null,
                        // }
                    }, {
                        where: {
                            id: sto.id
                        }
                    })

                }


                
                
            }
            else{
                console.log(`Not found article for ${sto.symptom_name} - ${sto.treatment_name} - ${articleUrl}`);
                
                notFoundArticles.push(sto.articles_urls)
            }
        }
        
    }

    console.log('notFoundArticles: ', _.uniq(notFoundArticles).join(', '))

}

async function fixIds(treatmentMaster: any[], symptomsAndConditions: any[]){
    const symptomTreatmentsOwn = ((await SymptomTreatmentsOwn.findAll({ 
        raw: true,
      })) || [])

    const symptomsNotFound = []
    const conditionsNotFound = []
    const treatmentsNotFound = []

    for(const sto of symptomTreatmentsOwn){
        if(sto?.treatment_name?.length && !sto?.treatment_id){
            sto.treatment_id = treatmentMaster.find(tm => (tm.treatment_name??'').trim().toLowerCase().replace(/\W/g,'') === sto.treatment_name.trim().toLowerCase().replace(/\W/g,''))?.treatment_id

            if(!sto.treatment_id){
                treatmentsNotFound.push(sto.treatment_name)
            }
        }

        if(sto?.symptom_name?.length && !sto?.symptom_id){
            sto.symptom_id = symptomsAndConditions.find(sc => (sc.symptom_name??'').trim().toLocaleUpperCase() === sto.symptom_name.trim().toLocaleUpperCase())?.symptom_id

            if(!sto.symptom_id){
                symptomsNotFound.push(sto.symptom_name)
            }
        }

        if(sto?.condition_name?.length && !sto?.condition_id){
            sto.condition_id = symptomsAndConditions.find(sc => (sc.symptom_name??'').trim().toLocaleUpperCase() === sto.condition_name.trim().toLocaleUpperCase())?.symptom_id

            if(!sto.condition_id){
                conditionsNotFound.push(sto.condition_name)
            }
        }

        await SymptomTreatmentsOwn.update({
            treatment_id: sto.treatment_id,
            symptom_id: sto.symptom_id,
            condition_id: sto.condition_id
        }, {
            where: {
                id: sto.id
            }
        })
    }

    console.log('symptomsNotFound: ', _.uniq(symptomsNotFound).join(', '))
    console.log('conditionsNotFound: ', _.uniq(conditionsNotFound).join(', '))
    console.log('treatmentsNotFound: ', _.uniq(treatmentsNotFound).join(', '))
}




