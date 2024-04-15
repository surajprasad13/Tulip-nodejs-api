import { Request, Response } from 'express'
import TreatmentMaster from '../../models/masters/treatment_master'
import SymptomTreatments from '../../models/symptom_treatments'
import SymptomConditionMaster from '../../models/symptom_condition_master'
import { buildBaseRecObject } from './build-base-rec-object'
import * as _ from 'lodash'
import { findConditionTreatments } from './find-condition-treatments'
import { findSymptomTreatments } from './find-symptom-treatments';
import MedicineArticlesForbidden from '../../models/medicine_articles_forbidden';
import { removeSimilarTreatments } from './remove-similar-treatments'
import { mergeSimilarTreatments } from './merge-similar-treatments'
import axios from "axios"
import SymptomTreatmentsOwn from '../../models/symptom_treatments_own'
import SymptomTreatmentsAvoid from '../../models/symptom_treatments_avoid'
import Drinks from '../../models/masters/drinks'


const getSmartRecommendation7 = async (req: Request, res: Response) => {
  try {
    let { main_symptoms_conditions, other_symptoms_conditions, possible_conditions, user_constitution, chat } = req.body

    const userSymptomsAndConditionsIds = [...main_symptoms_conditions, ...other_symptoms_conditions]

    console.log('main_symptoms_conditions')
    console.log(main_symptoms_conditions)

    console.log('other_symptoms_conditions')
    console.log(other_symptoms_conditions)

    console.log('possible_conditions')
    console.log(possible_conditions)

    console.log('user_constitution')
    console.log(user_constitution)

    if(!main_symptoms_conditions?.length && other_symptoms_conditions?.length){
      main_symptoms_conditions = [other_symptoms_conditions[0]]
      other_symptoms_conditions = other_symptoms_conditions.slice(1)      
    }

    const allDrinks = (await Drinks.findAll({
      raw: true,  
    })) ?? [];

    const symptomsTreatments = await getSymptomsTreatments()

    const medicineArticlesForbidden = await getForbiddenArticles()

    const treatmentsMaster = setTreatmentsSymptomsAndConditions(((await TreatmentMaster.findAll({ 
      raw: true,
      attributes: [
        'id',
        'treatment_id',
        'treatment_name',
        'treatment_type',
        'common_names',
        'image_url',
        'main_actions_id',
        'supporting_actions_id',
        'categories',
        'constitution',
        'ayurvedic_name',
        'chinese_name',
        'humata_synonyms',
        'gpt_treatment_name',
        'treatment_synonyms'

      ]
    })) || []), symptomsTreatments).map((t: any) => ({
      ...t,
      main_actions_id: _.uniq((t?.main_actions_id??'').split(';').map((s: string) => +(s.trim())).filter((s: number) => s)),
      supporting_actions_id: _.uniq((t?.supporting_actions_id??'').split(';').map((s: string) => +(s.trim())).filter((s: number) => s)),
      categories: _.uniq((t?.categories??'').split(';').map((s: string) => +(s.trim())).filter((s: number) => s)),
      constitution: (t?.constitution??'').split(',').map((c: any) => +c.trim()).filter((c: any) => !!c),
    }))

    const treatmentsById = treatmentsMaster.reduce((acc: any, t: any) => {
      acc[+t.treatment_id] = {
        ...t,
      }

      return acc
    },
    {})


    const symptomsAndConditions = await getSymptomsAndConditions(symptomsTreatments)

    const symptomsAndConditionsById = symptomsAndConditions.reduce((acc: any, s: any) => {
      acc[+s.symptom_id] = {
        ...s,
      }

      return acc
    }, {})

    let recommendationsObject:any = buildBaseRecObject(main_symptoms_conditions, other_symptoms_conditions, symptomsAndConditionsById)

    if(recommendationsObject.condition){
      if(recommendationsObject.symptom){
        recommendationsObject.treatments = findSymptomTreatments(recommendationsObject.symptom.symptom_id, [recommendationsObject.condition.symptom_id], symptomsTreatments)
        
        const treatmentsIds = [...recommendationsObject.treatments]

        recommendationsObject.treatments = recommendationsObject.treatments.map((t: number) => treatmentsById[t]).filter((t: any) => t)
        recommendationsObject.treatments = matchTreatmentsToUserSymptomsAndConditions(recommendationsObject.treatments, [recommendationsObject.condition.symptom_id, recommendationsObject.symptom.symptom_id], symptomsAndConditionsById)
        recommendationsObject.treatments = await parseTreatments(recommendationsObject.treatments, symptomsTreatments, [recommendationsObject.condition.symptom_id, recommendationsObject.symptom.symptom_id], medicineArticlesForbidden, treatmentsMaster, symptomsAndConditionsById, chat, allDrinks, user_constitution) 
        
        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = []

        const otherSymptomsAndConditionsIds = (recommendationsObject.otherSymptomsAndConditions??[]).map((s: any) => s.symptom_id)

        for(const symptomCondition of (recommendationsObject.otherSymptomsAndConditions??[])){
          if(symptomCondition.symptom_type === 'condition'){
            recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.push(...findConditionTreatments(symptomCondition.symptom_id, otherSymptomsAndConditionsIds, symptomsTreatments))
          }
          else{
            recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.push(...findSymptomTreatments(symptomCondition.symptom_id, otherSymptomsAndConditionsIds, symptomsTreatments))
          }
        }

        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = _.difference(_.uniq(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions), treatmentsIds)
        
        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.map((t: number) => treatmentsById[t]).filter((t: any) => t)
        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = matchTreatmentsToUserSymptomsAndConditions(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions, otherSymptomsAndConditionsIds, symptomsAndConditionsById)
        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = await parseTreatments(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions, symptomsTreatments, otherSymptomsAndConditionsIds,  medicineArticlesForbidden, treatmentsMaster, symptomsAndConditionsById, chat, allDrinks, user_constitution)
      }
      else{
        const relatedSymptomsIds = (recommendationsObject?.relatedSymptoms??[]).map((s: any) => s.symptom_id)

        recommendationsObject.treatments = findConditionTreatments(recommendationsObject.condition.symptom_id, relatedSymptomsIds, symptomsTreatments)
        
        const treatmentsIds = [...recommendationsObject.treatments]

        recommendationsObject.treatments = recommendationsObject.treatments.map((t: number) => treatmentsById[t]).filter((t: any) => t)
        recommendationsObject.treatments = matchTreatmentsToUserSymptomsAndConditions(recommendationsObject.treatments, [recommendationsObject.condition.symptom_id,...relatedSymptomsIds], symptomsAndConditionsById)
        recommendationsObject.treatments = await parseTreatments(recommendationsObject.treatments, symptomsTreatments, [recommendationsObject.condition.symptom_id,...relatedSymptomsIds], medicineArticlesForbidden, treatmentsMaster, symptomsAndConditionsById, chat, allDrinks, user_constitution)

        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = []

        const unrelatedSymptomsAndConditionsIds = (recommendationsObject.unrelatedSymptomsAndConditions??[]).map((s: any) => s.symptom_id)

        for(const symptomCondition of (recommendationsObject.unrelatedSymptomsAndConditions??[])){
          if(symptomCondition.symptom_type === 'condition'){
            recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.push(...findConditionTreatments(symptomCondition.symptom_id, unrelatedSymptomsAndConditionsIds, symptomsTreatments))
          }
          else{
            recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.push(...findSymptomTreatments(symptomCondition.symptom_id, unrelatedSymptomsAndConditionsIds, symptomsTreatments))
          }
        }

        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = _.difference(_.uniq(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions), treatmentsIds)
        
        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.map((t: number) => treatmentsById[t]).filter((t: any) => t)
        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = matchTreatmentsToUserSymptomsAndConditions(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions, unrelatedSymptomsAndConditionsIds, symptomsAndConditionsById)
        recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = await parseTreatments(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions, symptomsTreatments, unrelatedSymptomsAndConditionsIds,  medicineArticlesForbidden, treatmentsMaster, symptomsAndConditionsById, chat, allDrinks, user_constitution)
      }
    }
    else{
      const userMainSymptomId = recommendationsObject.symptom.symptom_id

      recommendationsObject.treatments = findSymptomTreatments(recommendationsObject.symptom.symptom_id, [], symptomsTreatments)

      const treatmentsIds = [...recommendationsObject.treatments]

      recommendationsObject.treatments = recommendationsObject.treatments.map((t: number) => treatmentsById[t]).filter((t: any) => t)
      recommendationsObject.treatments = matchTreatmentsToUserSymptomsAndConditions(recommendationsObject.treatments, [userMainSymptomId], symptomsAndConditionsById)
      recommendationsObject.treatments = await parseTreatments(recommendationsObject.treatments, symptomsTreatments, [userMainSymptomId], medicineArticlesForbidden, treatmentsMaster, symptomsAndConditionsById, chat, allDrinks, user_constitution)
      
      recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = []

      const unrelatedSymptomsAndConditionsIds = (recommendationsObject.otherSymptomsAndConditions??[]).map((s: any) => s.symptom_id)
      

      for(const symptomCondition of (recommendationsObject.otherSymptomsAndConditions??[])){
        if(symptomCondition.symptom_type === 'condition'){
          recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.push(...findConditionTreatments(symptomCondition.symptom_id, unrelatedSymptomsAndConditionsIds, symptomsTreatments))
        }
        else{
          recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.push(...findSymptomTreatments(symptomCondition.symptom_id, unrelatedSymptomsAndConditionsIds, symptomsTreatments))
        }
      }

      recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = _.difference(_.uniq(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions), treatmentsIds)
      
      recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = recommendationsObject.treatmentsUnrelatedSymptomsAndConditions.map((t: number) => treatmentsById[t]).filter((t: any) => t)
      recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = matchTreatmentsToUserSymptomsAndConditions(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions, unrelatedSymptomsAndConditionsIds, symptomsAndConditionsById)
      recommendationsObject.treatmentsUnrelatedSymptomsAndConditions = await parseTreatments(recommendationsObject.treatmentsUnrelatedSymptomsAndConditions, symptomsTreatments, unrelatedSymptomsAndConditionsIds,  medicineArticlesForbidden, treatmentsMaster, symptomsAndConditionsById, chat, allDrinks, user_constitution)
    }

    recommendationsObject = await rankArticlesFromRecommendationObject(chat, recommendationsObject)


    recommendationsObject.treatmentsFull = treatmentsMaster.map((t: any) => ({
      treatment_id: t?.treatment_id,
      treatment_name: t?.treatment_name,
      image_url: t?.image_url,
      gpt_treatment_name: t?.gpt_treatment_name,
      treatment_synonyms: t?.treatment_synonyms,
      humata_synonyms: t?.humata_synonyms,
      common_names: t?.common_names,
      ayurvedic_name: t?.ayurvedic_name,
      chinese_name: t?.chinese_name,
      constitution: t?.constitution,
      treatment_type: t?.treatment_type,
    }))

    recommendationsObject.treatments.supplements = sortTreatments([...(recommendationsObject?.treatments?.supplements??[]), ...(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.supplements??[])])


    recommendationsObject.treatments.supplements = recommendationsObject.treatments.supplements.slice(0,6)

    recommendationsObject.treatments.foods = sortTreatments([...(recommendationsObject?.treatments?.foods??[]), ...(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.foods??[])])


    if(recommendationsObject?.treatments?.foods?.length){
      recommendationsObject.treatments.foods = recommendationsObject.treatments.foods.slice(0,12)
    }
    
    recommendationsObject.treatments.lifestyles = sortTreatments([...(recommendationsObject?.treatments?.lifestyles??[]), ...(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.lifestyles??[])])
    

    if(recommendationsObject?.treatments?.lifestyles?.length){
      recommendationsObject.treatments.lifestyles = recommendationsObject.treatments.lifestyles.slice(0,6)
    }
    
    recommendationsObject.treatments.ayurvedicSupplements = sortTreatments([...(recommendationsObject?.treatments?.ayurvedicSupplements??[]), ...(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.ayurvedicSupplements??[])])
    

    if(recommendationsObject?.treatments?.ayurvedicSupplements?.length){
      recommendationsObject.treatments.ayurvedicSupplements = recommendationsObject.treatments.ayurvedicSupplements.slice(0,6)
    }

    
    recommendationsObject.treatments.ayurvedicLifestyles = sortTreatments([...(recommendationsObject?.treatments?.ayurvedicLifestyles??[]), ...(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.ayurvedicLifestyles??[])])
    

    if(recommendationsObject?.treatments?.ayurvedicLifestyles?.length){
      recommendationsObject.treatments.ayurvedicLifestyles = recommendationsObject.treatments.ayurvedicLifestyles.slice(0,6)
    }

    
    recommendationsObject.treatments.ayurvedicFoods = sortTreatments([...(recommendationsObject?.treatments?.ayurvedicFoods??[]), ...(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.ayurvedicFoods??[])])
    
    if(recommendationsObject?.treatments?.ayurvedicFoods?.length){
      recommendationsObject.treatments.ayurvedicFoods = recommendationsObject.treatments.ayurvedicFoods.slice(0,6)
    }


    return res.json(recommendationsObject)
  } catch (error) {
    console.log(error)

    res.status(400).send({ error })
  }
}

async function sortArticlesByTextSimilarity(articles: any[], query: string){
  // if((articles?.length??0) < 2){
  //   return articles
  // }
  
	// const articlesQuery = articles.reduce((acc: any, article: any) => {		
	// 	const expectedImprovement = article?.howMuch??''
	// 	const keyRoles = (article?.keyRoles??[]).join('\n')
			
	// 	acc[article.articlePubmedId] = (article.title??'')+' \n '+expectedImprovement+' \n '+keyRoles	+' \n '+(article.keyRolesExplanation??'')
		
	// 	return acc
	// },{})

	// try{
	// 	const body = {
	// 		query_info: query,
	// 		articles: articlesQuery,
	// 	}	

	// 	const result = await axios.post('https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/data-models/top-articles', body)

	// 	articles = articles.filter((a: any) => (result.data?.article_ids??[]).includes(a.pubmed_id))

	// 	articles.forEach((article:any) => {
	// 		article.topArticleIndex = ((result.data??{})?.article_ids??[]).findIndex((id:any) => +id === +article.pubmed_id)
	// 	});

	// 	articles = _.orderBy(articles, ['topArticleIndex'], ['asc'])		
	// 	}
		
	// 	catch(e){
	// 	console.log('top-articles error');
	// 	console.log(e);
	// 	}		

		return articles
}

async function rankArticlesFromRecommendationObject(chat: any[], recommendationsObject: any){
  if(!chat?.length){
    return recommendationsObject
  }

  const text = chat.reduce((acc: string, c: any) => acc + ' ' + c.content, '')

  if(recommendationsObject?.treatments?.supplements?.length){
    for(const treatment of recommendationsObject.treatments.supplements){
      if(treatment?.articles?.length){
        treatment.articles = await sortArticlesByTextSimilarity(treatment.articles, text)
      }
    }
  }

  if(recommendationsObject?.treatments?.foods?.length){
    for(const treatment of recommendationsObject.treatments.foods){
      if(treatment?.articles?.length){
        treatment.articles = await sortArticlesByTextSimilarity(treatment.articles, text)
      }
    }
  }

  if(recommendationsObject?.treatments?.lifestyles?.length){
    for(const treatment of recommendationsObject.treatments.lifestyles){
      if(treatment?.articles?.length){
        treatment.articles = await sortArticlesByTextSimilarity(treatment.articles, text)
      }
    }
  }

  if(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.supplements?.length){
    for(const treatment of recommendationsObject.treatments.supplements){
      if(treatment?.articles?.length){
        treatment.articles = await sortArticlesByTextSimilarity(treatment.articles, text)
      }
    }
  }

  if(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.foods?.length){
    for(const treatment of recommendationsObject.treatments.foods){
      if(treatment?.articles?.length){
        treatment.articles = await sortArticlesByTextSimilarity(treatment.articles, text)
      }
    }
  }

  if(recommendationsObject?.treatmentsUnrelatedSymptomsAndConditions?.lifestyles?.length){
    for(const treatment of recommendationsObject.treatments.lifestyles){
      if(treatment?.articles?.length){
        treatment.articles = await sortArticlesByTextSimilarity(treatment.articles, text)
      }
    }
  }

  return recommendationsObject
}

function formatFirstLetterUpperCase(str: string) {
  if (!str) {
    return '';
  }

  str = str.trim();

  if (str.match(/^[a-zA-Z]/g)) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const match = str.match(/[a-zA-Z]/);

  const position = match ? match.index : -1;

  return (
    str.slice(0, position) +
    str.charAt(position ?? 0).toUpperCase() +
    str.slice((position ?? 0) + 1)
  );
}

function filterForbiddenArticles(articles:any[], medicineArticlesForbidden: number[]) {
  return articles.filter((a: any) => !medicineArticlesForbidden.includes(+a.articlePubmedId))
}

function removeTreatmentInfoAboutNotMentionedSymptomsAndConditions(treatments: any[], userSymptomsAndConditions: number[], symptomsAndConditionsById: any){
  const userSymptomsAndConditionsNames = userSymptomsAndConditions.map((s: number) => symptomsAndConditionsById[s]?.symptom_name)
  const nonMentioned = _.values(symptomsAndConditionsById).filter((s: any) => s?.symptom_type === 'condition').map((s: any) => s?.symptom_name).filter((s: string) => !userSymptomsAndConditionsNames.includes(s))
  
  return treatments.map((t: any) => ({
    ...t,
    symptomsTreatments: (t?.symptomsTreatments??[]).map((st: any) => {
      if(st?.summarized_data?.key_roles?.length){
        if(Array.isArray(st.summarized_data.key_roles)){
          st.summarized_data.key_roles = st.summarized_data.key_roles.filter((kr: any) => !stringContainsString(kr,nonMentioned)).filter(
            (kr: string, idx: number) =>
              kr.match(/[a-zA-Z]/g) &&              
              (idx > 0 || !kr.trim().endsWith(':'))
          ).filter((kr: any) => !(kr??'').toLowerCase().replace(/\W/g,'').includes('moreresearchisneeded') && !(kr??'').toLowerCase().replace(/\W/g,'').includes('moreresearchneeded'))

          if(!st.summarized_data.key_roles.length){
            st.summarized_data.key_roles = null          
          }
        }
        else{
          if(stringContainsString(st.summarized_data.key_roles,nonMentioned)){
            st.summarized_data.key_roles = null
          }
        }
      }

      if(st?.summarized_data?.expected_improvement?.length && stringContainsString(st.summarized_data.expected_improvement,nonMentioned)){
        st.summarized_data.expected_improvement = null
      }

      if(st?.summarized_data?.benefit?.length && stringContainsString(st.summarized_data.benefit,nonMentioned)){
        st.summarized_data.benefit = null
      }

      return st
    //}).filter((st: any) => st?.summarized_data?.key_roles?.length || st?.summarized_data?.expected_improvement?.length || st?.summarized_data?.benefit?.length)
  }).filter((st: any) => true)
  })).filter((t: any) => t.symptomsTreatments?.length)

}
function removeArticlesAboutNotMentionedSymptomsAndConditions(treatments: any[], userSymptomsAndConditions: number[], symptomsAndConditionsById: any){
  const userSymptomsAndConditionsNames = userSymptomsAndConditions.map((s: number) => symptomsAndConditionsById[s]?.symptom_name)
  const nonMentioned = _.values(symptomsAndConditionsById).map((s: any) => s?.symptom_name).filter((s: string) => !userSymptomsAndConditionsNames.includes(s))
    
  return treatments.map((t: any) => ({
    ...t,
    articles: (t?.articles??[]).filter((a: any) => !stringContainsString(a.title,nonMentioned))
  }))
}

function stringContainsString(str: string, strings: string[]){
  for(const s of strings){
    if(str.toLowerCase().includes(s.toLowerCase())){
      return true
    }
  }

  return false
}
async function removeTreatmentsToBeAvoided(treatments: any[]){
  const symptomTreatmentsAvoid = await SymptomTreatmentsAvoid.findAll({
    raw: true,
  })

  treatments = treatments.map((t: any) => ({
    ...t,
    symptomsTreatments: t.symptomsTreatments.filter((st: any) => symptomTreatmentsAvoid.find((sta: any) => ((sta.treatment_id === st.treatment_id) && (sta.symptom_id === st.symptom_id) && (sta.condition_id === st.condition_id))) === undefined )
  }))

  return treatments
}

async function parseTreatments(treatments: any[], symptomsTreatments: any[], userSymptomsAndConditions: number[], medicineArticlesForbidden: number[], treatmentsMaster: any[], symptomsAndConditionsById: any, chat: any[], allDrinks: any[], user_constitution: number[]){
  
  let symptomsMainActions = []
  let symptomsSupportingActions = []
  let categories = []
  let drinks:any[] = []

  //console.log('SYMPTOMS');
  for(const symptom_id of userSymptomsAndConditions){
    //console.log(`${symptom_id} - ${symptomsAndConditionsById[symptom_id]?.symptom_name} - ${symptomsAndConditionsById[symptom_id]?.main_actions_symptoms_id} - ${symptomsAndConditionsById[symptom_id]?.supporting_actions_id}`);    

    if(symptomsAndConditionsById[symptom_id]?.main_actions_symptoms_id?.length){
      symptomsMainActions.push(...symptomsAndConditionsById[symptom_id]?.main_actions_symptoms_id)
    }

    if(symptomsAndConditionsById[symptom_id]?.supporting_actions_id?.length){
      symptomsSupportingActions.push(...symptomsAndConditionsById[symptom_id]?.supporting_actions_id)
    }

    if(symptomsAndConditionsById[symptom_id]?.categories_vitamins?.length){
      categories.push(...symptomsAndConditionsById[symptom_id]?.categories_vitamins)
    }

    if(symptomsAndConditionsById[symptom_id]?.id_drink?.length){
      symptomsAndConditionsById[symptom_id]?.id_drink.split(';').map((d: string) => +d).forEach((d: number) => {
        if(allDrinks.find((dr: any) => dr.id_drink === d)){
          drinks.push(allDrinks.find((dr: any) => dr.id_drink === d))
        }
      })
    }
  }
  
  drinks = _.uniqBy(drinks, 'id_drink')

  if(!chat?.length){
    chat = [{
      content: `My symptoms and conditions are: ${userSymptomsAndConditions.map((s: number) => symptomsAndConditionsById[s]?.symptom_name).join(', ')}`,
      role: 'user'
    }]
  }

  symptomsMainActions = _.uniq(symptomsMainActions)
  symptomsSupportingActions = _.uniq(symptomsSupportingActions)
  categories = _.uniq(categories)

  let vitamins = []
  let herbs = []

  treatments = treatments.map((t: any) => parseTreatment(t, symptomsTreatments, userSymptomsAndConditions, medicineArticlesForbidden))

  treatments = await removeTreatmentsToBeAvoided(treatments)

  treatments = removeArticlesAboutNotMentionedSymptomsAndConditions(treatments, userSymptomsAndConditions,symptomsAndConditionsById)

  treatments = removeTreatmentInfoAboutNotMentionedSymptomsAndConditions(treatments, userSymptomsAndConditions,symptomsAndConditionsById)

  for(const t of treatments){    
    if(((t.treatment_type??'').includes('herb')) && t?.symptomsTreatments?.length){        
      herbs.push(t)
    }
    else{
      if((t.treatment_type??'').includes('vitamin')){
        vitamins.push(t)
      }
    }

    t.articles = (t?.articles??[]).map((a: any) => ({
      url: a?.url,
      title: a?.title,
    }))

    t.symptomsTreatments = t.symptomsTreatments.map((st: any) => ({
      ...st,
      articles: []
    }))
  }
  
  //console.log('HERBS');
  
  for(const herb of herbs){
    herb.main_overlapping_actions = _.intersection(herb.main_actions_id, symptomsMainActions)
    herb.supporting_overlapping_actions = _.intersection(herb.supporting_actions_id, symptomsSupportingActions)

    //console.log(`${herb.treatment_id} (${herb.main_overlapping_actions} - ${herb.supporting_overlapping_actions}) - ${herb.treatment_name} - ${herb.main_actions_id} - ${herb.supporting_actions_id}`); 
  }

  //console.log('VITAMINS');

  for(const vitamin of vitamins){
    vitamin.overlapping_categories = _.intersection(vitamin.categories, categories)

    //console.log(`${vitamin.treatment_id} (${vitamin.overlapping_categories}) - ${vitamin.treatment_name} - ${vitamin.categories}`);
  }
  

  herbs.sort((a: any, b: any) => {
    if(a.main_overlapping_actions.length > b.main_overlapping_actions.length){
      return -1
    }
    else if(a.main_overlapping_actions.length < b.main_overlapping_actions.length){
      return 1
    }

    if(a.supporting_overlapping_actions.length > b.supporting_overlapping_actions.length){
      return -1
    }
    else if(a.supporting_overlapping_actions.length < b.supporting_overlapping_actions.length){
      return 1
    }

    if(a.symptomsAndConditions.length > b.symptomsAndConditions.length){
      return -1
    }
    else if(a.symptomsAndConditions.length < b.symptomsAndConditions.length){
      return 1
    }

    if(a.symptomsTreatments.length > b.symptomsTreatments.length){
      return -1
    }
    else if(a.symptomsTreatments.length < b.symptomsTreatments.length){
      return 1
    }

    if(a.articles.length > b.articles.length){
      return -1
    }
    else if(a.articles.length < b.articles.length){
      return 1
    }

    return 0
  })

   //console.log('SORTED HERBS');
  
   //for(const herb of herbs){
     //console.log(`${herb.treatment_id} (${herb.main_overlapping_actions} - ${herb.supporting_overlapping_actions}) - ${herb.treatment_name} - ${herb.main_actions_id} - ${herb.supporting_actions_id}`); 
  //}


//  let supplementsGPT:any[] = [...herbs]

let ayurvedic_herbs = _.uniqBy(JSON.parse(JSON.stringify(herbs)), 'treatment_id')

let ayurvedic_herbs_non_filtered = ayurvedic_herbs.filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => [1,2,3].includes(c)))

let ayurvedic_herbs_filtered = ayurvedic_herbs_non_filtered.filter((t: any) => t.constitution.some((c: any) => (user_constitution??[]).includes(c)))   

ayurvedic_herbs = ayurvedic_herbs_filtered?.length <= 5 ? ayurvedic_herbs_non_filtered : ayurvedic_herbs_filtered

herbs = herbs.slice(0,3)

  vitamins = sortVitamins(mergeSimilarTreatments(removeSimilarTreatments(vitamins), treatmentsMaster)).filter((t: any) => ((t.totalArticles > 0) || (t.symptomsTreatments?.length)))

  vitamins = vitamins.map((t: any) => ({
    ...t,
    symptomsTreatments: _.uniqBy(t.symptomsTreatments, 'symptomConditionNames')
  }))

  // supplementsGPT.push(...sortVitamins(vitamins).filter((t: any) => ((t.symptomsTreatments?.length))))

  let ayurvedic_vitamins = _.uniqBy(JSON.parse(JSON.stringify(vitamins)), 'treatment_id')

  let ayurvedic_vitamins_non_filtered = ayurvedic_vitamins.filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => [1,2,3].includes(c)))

  let ayurvedic_vitamins_filtered = ayurvedic_vitamins_non_filtered.filter((t: any) => t.constitution.some((c: any) => (user_constitution??[]).includes(c)))  
  
  ayurvedic_vitamins = ayurvedic_vitamins_filtered?.length <= 5 ? ayurvedic_vitamins_non_filtered : ayurvedic_vitamins_filtered

  vitamins = vitamins.slice(0, 6-herbs.length)
  
  // console.log('SORTED VITAMINS');

  // for(const vitamin of vitamins){
  //   console.log(`${vitamin.treatment_id} (${vitamin.overlapping_categories}) - ${vitamin.treatment_name} - ${vitamin.categories}`);
  // }

  // supplementsGPT =  sortTreatments(supplementsGPT)

  // const supplementsGPTIds = supplementsGPT.map((s: any) => s.treatment_id)


  let supplements = [...herbs, ...vitamins]

  let supplementsIds = supplements.map((s: any) => s.treatment_id)

  let foods = sortTreatments(treatments.filter((t: any) => (((t.treatment_type??'').includes('food'))))).filter((t: any) => (((t.totalArticles > 0) || (t.symptomsTreatments?.length)) && !supplementsIds.includes(t?.treatment_id)))
  
  let ayurvedic_foods = _.uniqBy(JSON.parse(JSON.stringify(foods)), 'treatment_id')

  let ayurvedic_foods_non_filtered = ayurvedic_foods.filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => [1,2,3].includes(c)))

  let ayurvedic_foods_filtered = ayurvedic_foods_non_filtered.filter((t: any) => t.constitution.some((c: any) => (user_constitution??[]).includes(c)))

  ayurvedic_foods = ayurvedic_foods_filtered?.length <= 5 ? ayurvedic_foods_non_filtered : ayurvedic_foods_filtered

  //foods = foods.slice(0, 6)
  let lifestyles = sortTreatments(treatments.filter((t: any) => (((t.treatment_type??'').includes('lifestyle'))))).filter((t: any) => ((t.totalArticles > 0) || (t.symptomsTreatments?.length)))

  let ayurvedic_lifestyles = _.uniqBy(JSON.parse(JSON.stringify(lifestyles)), 'treatment_id')

  let ayurvedic_lifestyles_non_filtered = ayurvedic_lifestyles.filter((t: any) => t?.constitution?.length && t.constitution.some((c: any) => [1,2,3].includes(c)))

  let ayurvedic_lifestyles_filtered = ayurvedic_lifestyles_non_filtered.filter((t: any) => t.constitution.some((c: any) => (user_constitution??[]).includes(c)))

  ayurvedic_lifestyles = ayurvedic_lifestyles_filtered?.length <= 5 ? ayurvedic_lifestyles_non_filtered : ayurvedic_lifestyles_filtered

 // lifestyles = lifestyles.slice(0, 6)
  //let foodsGPT = sortTreatments([...treatments.filter((t: any) => (((t.treatment_type??'').includes('food')))).filter((t: any) => (((t.totalArticles > 0) || (t.symptomsTreatments?.length))  && !supplementsGPTIds.includes(t?.treatment_id)))])
  
  //let lifestylesGPT = sortTreatments([...treatments.filter((t: any) => (((t.treatment_type??'').includes('lifestyle')))).filter((t: any) => (((t.totalArticles > 0) || (t.symptomsTreatments?.length))))])

  ayurvedic_herbs = ayurvedic_herbs.slice(0, 3)
  ayurvedic_vitamins = ayurvedic_vitamins.slice(0, 6-herbs.length)

  let ayurvedic_supplements = [...ayurvedic_herbs, ...ayurvedic_vitamins]
  
  //ayurvedic_foods = ayurvedic_foods.slice(0, 6)
  //ayurvedic_lifestyles = ayurvedic_lifestyles.slice(0, 6)  
  
  return ({
     supplements,
     foods,
     lifestyles,
     ayurvedicSupplements: ayurvedic_supplements,
      ayurvedicFoods: ayurvedic_foods,
      ayurvedicLifestyles: ayurvedic_lifestyles,
    //  supplementsGPT,
    //   foodsGPT,
    //   lifestylesGPT,
      chat,
      drinks
  })
}

function sortVitamins(vitamins: any[]){
  vitamins.sort((a: any, b: any) => {
    if(a.overlapping_categories.length > b.overlapping_categories.length){
      return -1
    }
    else if(a.overlapping_categories.length < b.overlapping_categories.length){
      return 1
    }

    if(a.symptomsAndConditions.length > b.symptomsAndConditions.length){
      return -1
    }
    else if(a.symptomsAndConditions.length < b.symptomsAndConditions.length){
      return 1
    }

    if(a.symptomsTreatments.length > b.symptomsTreatments.length){
      return -1
    }
    else if(a.symptomsTreatments.length < b.symptomsTreatments.length){
      return 1
    }

    if(a.articles.length > b.articles.length){
      return -1
    }
    else if(a.articles.length < b.articles.length){
      return 1
    }

    return 0
  })

  return vitamins
}

function sortTreatments(treatments: any[]){
  treatments.sort((a: any, b: any) => {
    const validSymptomTreatmentsA = (a?.symptomsTreatments??[]).filter((st: any) => st?.summarized_data?.key_roles?.length || st?.summarized_data?.expected_improvement?.length || st?.summarized_data?.benefit?.length)
    const validSymptomTreatmentsB = (b?.symptomsTreatments??[]).filter((st: any) => st?.summarized_data?.key_roles?.length || st?.summarized_data?.expected_improvement?.length || st?.summarized_data?.benefit?.length)

    if(validSymptomTreatmentsA.length > validSymptomTreatmentsB.length){
      return -1
    }
    else if(validSymptomTreatmentsA.length < validSymptomTreatmentsB.length){
      return 1
    }

    if(a.symptomsAndConditions.length > b.symptomsAndConditions.length){
      return -1
    }
    else if(a.symptomsAndConditions.length < b.symptomsAndConditions.length){
      return 1
    }

    if(a.symptomsTreatments.length > b.symptomsTreatments.length){
      return -1
    }
    else if(a.symptomsTreatments.length < b.symptomsTreatments.length){
      return 1
    }

    if(a.articles.length > b.articles.length){
      return -1
    }
    else if(a.articles.length < b.articles.length){
      return 1
    }
    

    return 0
  })

  return treatments
}

function parseTreatment(treatment: any, symptomsTreatments: any[], userSymptomsAndConditions: number[], medicineArticlesForbidden: number[]){
  treatment.articles = []

  let filteredSymptomsTreatments = symptomsTreatments.filter((st: any) => (st.symptom_id !== st.condition_id) && (st.treatment_id === treatment.treatment_id) && ((!st.symptom_id) || (userSymptomsAndConditions?.includes(st.symptom_id))) && ((!st.condition_id) || (userSymptomsAndConditions?.includes(st.condition_id))))
  
  for(const filteredSymptomsTreatment of filteredSymptomsTreatments){
    if(filteredSymptomsTreatment?.articles?.length){
      treatment.articles.push(...filteredSymptomsTreatment?.articles)
    }
  }
  treatment.articles = _.uniqBy(treatment.articles, 'url')

  treatment.totalArticles = treatment.articles?.length

  treatment.articles = filterForbiddenArticles(treatment.articles, medicineArticlesForbidden)

  //filteredSymptomsTreatments = filteredSymptomsTreatments.filter((st: any) => ((st.symptom_id || st.condition_id) && st.summarized_data && (st?.summarized_data?.key_roles?.length || st?.summarized_data?.expected_improvement?.length || st?.summarized_data?.benefit?.length)))
  filteredSymptomsTreatments = filteredSymptomsTreatments.filter((st: any) => ((st.symptom_id || st.condition_id) && st.summarized_data && (st?.summarized_data?.key_roles?.length || st?.summarized_data?.expected_improvement?.length || st?.summarized_data?.benefit?.length || true)))

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

  treatment.symptomsTreatments = filteredSymptomsTreatments

  treatment.symptomsAndConditions = treatment.symptomsAndConditions.map((s: string) => formatFirstLetterUpperCase(s)).filter((s: any) => s)

  return treatment
}

function matchTreatmentsToUserSymptomsAndConditions(treatments: any[], symptomsAndConditionsIds: number[], symptomsAndConditionsById: any){
  return (treatments??[]).map((t: any) => ({
    ...t,
    symptomsAndConditions: (_.intersection(t.symptomsAndConditions??[], symptomsAndConditionsIds??[])).map((s: number) => symptomsAndConditionsById[s]?.symptom_name).filter((s: any) => s),
  }))
}

async function getForbiddenArticles() {
  return ((await MedicineArticlesForbidden.findAll({
    raw: true,   
  }))??[]).map((medicineArticleForbidden: any) => +medicineArticleForbidden.pubmed_id)
}

async function getSymptomsAndConditions (symptomsTreatments: any[]) {
  const symptomsAndConditions = ((await SymptomConditionMaster.findAll({ raw: true,
    attributes: [
      'id',
      'symptom_id',
      'symptom_name',
      'symptom_type',
      'symptoms',
      'main_actions_symptoms_id',
      'supporting_actions_id',
      'categories_vitamins',
      'connect_to_supplement',
      'connect_to_food',
      'connect_to_lifestyle',
      'id_drink',
    ]
   })) || []).map((s: any) => ({
    ...s,
    main_actions_symptoms_id: (s?.main_actions_symptoms_id??'').split(';').map((s: string) => +(s.trim())).filter((s: number) => s),
    supporting_actions_id: (s?.supporting_actions_id??'').split(';').map((s: string) => +(s.trim())).filter((s: number) => s),
    categories_vitamins: _.uniq((s?.categories_vitamins??'').split(';').map((s: string) => +(s.trim())).filter((s: number) => s)),
   }))

  const symptomsAndConditionsIdsByName = symptomsAndConditions.reduce((acc: any, s: any) => {
    acc[s.symptom_name] = s.symptom_id

    return acc
  }, {})

  for(const sc of symptomsAndConditions) {
    if(sc.symptom_type === 'condition'){      
      sc.symptoms = (sc.symptoms??'').split(';').map((s: string) => s.trim()).filter((s: string) => s !== '').map((s: string) => +symptomsAndConditionsIdsByName[s]).filter((s: number) => s)

      //sc.symptoms.push(...(symptomsTreatments.filter((st: any) => (st.condition_id === sc.symptom_id) && st.symptom_id).map((st: any) => st.symptom_id).filter((s: any) => s)))

      sc.symptoms = _.uniq(sc.symptoms)
    }
  }

  return symptomsAndConditions
}



function setTreatmentsSymptomsAndConditions(treatmentsMaster: any[], symptomsTreatments: any[]){
  for(const tm of treatmentsMaster){
    tm.symptomsAndConditions = []

    for(const st of symptomsTreatments){
      if(st.treatment_id === tm.treatment_id){
        if(st?.symptom_id){
          tm.symptomsAndConditions.push(st.symptom_id)
        }
  
        if(st?.condition_id){
          tm.symptomsAndConditions.push(st.condition_id)
        }
      }
    }

    tm.symptomsAndConditions = _.uniq(tm.symptomsAndConditions)
  }

  return treatmentsMaster
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

export { getSmartRecommendation7 }
