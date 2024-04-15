import { Request, Response } from "express"
import { QuestionsModel, UserAnswerModel, UserProfileModel } from "../../models"
import SmartInsights from "../../models/smart_insights"
import { getLoggedInUserId, similarity } from "../../utils"
const { Configuration, OpenAIApi } = require('openai')
import config from '../../config'
import MedicineArticles from "../../models/medicine_articles"
import * as _ from 'lodash'
import MedicineArticlesProcessed from "../../models/medicine_articles_processed"
import { Op, Sequelize } from 'sequelize'
import axios from "axios"
import * as preconditionsList from "../preconditions"
import SymptomMaster from '../../models/masters/symptom_master';
import TreatmentMaster from '../../models/masters/treatment_master';
import SymptomTreatmentsPdf from "../../models/symptom_treatments_pdf"
import SymptomFoods from "../../models/symptom_foods"
import SymptomTreatments from "../../models/symptom_treatments"
import MedicineArticlesOwn from "../../models/medicine_articles_own"
import MedicineArticlesProcessedOwn from "../../models/medicine_articles_processed_own"
import SymptomConditionMaster from "../../models/symptom_condition_master"
import SymptomTreatmentsHumata from "../../models/symptom_treatments_humata"




const getSmartInsightLandingPage = async (req: Request, res: Response) => {
	try {
		const symptoms = (req.query?.symptoms??'').toString().split(',') || []

		if(!symptoms.length) {
			return res.send()
		}

		const smartInsights = ((await SmartInsights.findAll({
			raw: true,
			where: {
				symptom: symptoms
			}
		}))||[]).map((si: any) => ({
			symptom: si.symptom,
			selectedTreatment: (si.treatments??{}).supplements[0] || (si.treatments??{}).foods[0] || null
		}))

		 for(const insight of smartInsights) {
			const messages = [
				insight?.selectedTreatment?.how,
				`Explain to me in a few words and layman's terms why should I take ${insight?.selectedTreatment?.name} and how this can improve my ${insight?.selectedTreatment?.name}.`,
				` Do it in an empathic way.`,
			].map((m: string) => ({ role: 'user', content: m }))

			console.log(messages);

			try {
				const configuration = new Configuration({
				  apiKey: config.OPENAI_API_KEY,
				})
			
				const openai = new OpenAIApi(configuration)
				const completion = await openai.createChatCompletion({
				  model: 'gpt-4',
				  messages,
				  temperature: 0.7,
				  max_tokens: 256,
				  top_p: 1,
				  frequency_penalty: 0,
				  presence_penalty: 0,
				})
			
				insight.selectedTreatment.gptText = completion.data.choices[0].message?.content || ''
				
				insight.selectedTreatment.name = firstLetterUpperCase(insight.selectedTreatment.name)

				console.log('OUTPUT');
				console.log(insight.selectedTreatment.gptText);
				
			  } catch (error: any) {
				console.log('ERROR')
				console.log(error?.response?.data?.error)
			  }
		}

		return res.send(smartInsights)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

const getFoodsSupplementsFromArticles = async (req: Request, res: Response) => {
	try {
		const symptoms = (req.query?.symptoms??'').toString().split(',') || []

		if(!symptoms.length) {
			return res.send()
		}

		return res.json(((await SmartInsights.findAll({
			raw: true,
			where: {
				symptom: symptoms
			}
		}))||[]))
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

function firstLetterUpperCase(str: string){
    return str.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const getAllArticles = async (req: Request, res: Response) => {
	try {
		const articles = ((await MedicineArticlesProcessed.findAll({
			raw: true,	
			where: {
				is_accepted: true
			}
		}))??[]).map((a: any) => ({
			...a,
			gpt: (_.omit((a?.gpt||{}), 'previousGPT'))
		}))

		return res.json(articles)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

const getAllArticlesOwn = async (req: Request, res: Response) => {
	try {
		const articles = ((await MedicineArticlesProcessedOwn.findAll({
			raw: true,	
			where: {
				is_accepted: true
			}
		}))??[]).map((a: any) => ({
			...a,
			gpt: (_.omit((a?.gpt||{}), 'previousGPT'))
		}))

		return res.json(articles)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

const getAllSymptomsAndTreatments = async (req: Request, res: Response) => {
	try {
		const symptomsAndTreatments = ((await SymptomTreatments.findAll({
			raw: true,	
		}))??[])

		return res.json(symptomsAndTreatments)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

const getAllSmartInsights = async (req: Request, res: Response) => {
	try {
		const smartInsights = ((await SmartInsights.findAll({
			raw: true,
		})))

		for(const smartInsight of smartInsights) {
			if(!smartInsight?.treatments?.supplements){
				continue
			}
			const mergedSupplements:any = {}

			if(smartInsight?.treatments?.supplements?.length) {
				for(const supplement of smartInsight.treatments.supplements) {
					const key = findSimilarKey(mergedSupplements, supplement.name)

					if(key) {
						const sameArticle = mergedSupplements[key].find((s: any) => s.articleLink === supplement.articleLink)

						if(!sameArticle){
							mergedSupplements[key].push(supplement)
						}
						
					} else {
						mergedSupplements[supplement.name] = [supplement]
					}
				}
			}


			const mergedSupplementsArray = Object.keys(mergedSupplements).map((key) => ({
				name: key,
				mergedSupplements: mergedSupplements[key],
			}))

			mergedSupplementsArray.sort((a, b) => b.mergedSupplements.length - a.mergedSupplements.length)

			if(smartInsight?.treatments?.supplements){
				delete smartInsight.treatments.supplements
			}

			if(smartInsight?.treatments?.foods){
				delete smartInsight.treatments.foods
			}

			smartInsight.treatments.mergedSupplements = mergedSupplementsArray

			for(const mergedSupplement of mergedSupplementsArray) {
				console.log(`${mergedSupplement.name} -->> ${mergedSupplement.mergedSupplements.length}` );
			}
		}

		return res.json(smartInsights)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

function findSimilarKey(mergedSupplements:any, key: string) {
	const keys = Object.keys(mergedSupplements)
	for(const k of keys) {
		if(isTheSameSupplement(k, key)) {
			return k
		}
	}

	return null
}

function isTheSameSupplement(supA: string, supB: string){
	supA = supA.trim().toLowerCase()
	supB = supB.trim().toLowerCase()
  
	if((supA.includes('vitamin')) && (supB.includes('vitamin'))){
	  return similarity(supA.replace('vitamin',''), supB.replace('vitamin','')) >= 0.98
	}
  
	return similarity(supA, supB) >= 0.85
  }

  const getSmartRecommendation2 = async (req: Request, res: Response) => {
	try {
		let { age, gender, symptoms, preconditions, freetext } = req.body

		age = (+age)||null
		gender = ((gender === 'male') || (gender === 'female'))? gender : null

		symptoms = (symptoms || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
		symptoms = symptoms?.length ? symptoms : null

		preconditions = (preconditions || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
		preconditions = preconditions?.length ? preconditions : null

		freetext = (freetext || '').trim()

		const output:any = {}

		for(const symptom of symptoms) {
			let articles = await findArticles(age, gender, symptom)

			const totalArticles = articles.length

			let mainArticles = (articles.filter((a: any) => (a?.gpt?.symptoms||{})[symptom].filter((t: any) => t?.mainSymptomTreatment === true)?.length))||[]

			const mainArticlesLength = mainArticles.length

			const filteredArticles = filterArticles(mainArticles, symptoms, preconditions)

			const filteredArticlesLength = filteredArticles.length
			
			const query = `${age} years old ${gender} with ${symptoms.join(', ')} ${(preconditions??[]).join(', ')} ${freetext}`

			articles = await sortArticlesByTextSimilarity(filteredArticles,query)

			output[symptom] = {
				symptomName: symptom,
				articles,
				totalArticles,
				mainArticles,
				mainArticlesLength,
				filteredArticles,
				filteredArticlesLength,
				query,
			}
		}

		return res.json(output)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

function getTotalArticlesPerTreatment(articles: any[], symptom: string) {
	let totalArticlesPerTreatment:any = {}

	for(const article of articles) {
		for(const treatment of ((article?.gpt?.symptoms||{})[symptom]||[])) {
			if(!totalArticlesPerTreatment[treatment?.treatment]) {
				totalArticlesPerTreatment[treatment?.treatment] = 0
			}

			totalArticlesPerTreatment[treatment?.treatment]++
		}
	}

	return totalArticlesPerTreatment
}

async function getTreatmentsFromPDF(treatmentsMasterIds: any) {
	const treatments:any = {}
	const symptomTreatment = await SymptomTreatmentsPdf.findAll({raw: true})

	for(const st of symptomTreatment) {
		if(!st.treatments_ids?.length) {
			continue
		}

		if(!treatments[st.symptom_id]) {
			treatments[st.symptom_id] = {}
		}

		for(const treatmentId of st.treatments_ids.split(';').map((s: string) => s.trim()).filter((s: string) => !!s).map((s: string) => +s)) {
			treatments[st.symptom_id][treatmentId] = {
				treatmentName: treatmentsMasterIds[treatmentId]?.name,
				treatmentId: treatmentsMasterIds[treatmentId]?.id,
				treatmentType: treatmentsMasterIds[treatmentId]?.type,
				totalArticles: 0,
				totalMainArticles: 0,
				bestMainFilteredArticle: null,
				preconditions: {},
				mainArticles: [],
				filteredArticles: [],
				fromPDF: true,
				prioritizedTreatment: false,
				dosagePDF: null,
				additionalInformationPDF: null,
				expectedImprovementPDF: null,
				keyRolesPDF: null
			}
		}

		if(st.prioritized_treatments?.length){
			for(const treatmentId of st.prioritized_treatments.split(';').map((s: string) => s.trim()).filter((s: string) => !!s).map((s: string) => +s)) {
				if(treatments[st.symptom_id][treatmentId]){
					treatments[st.symptom_id][treatmentId].prioritizedTreatment = true
				}
			}
		}
	

		if(st.dosage?.length){
			for(const dosageStr of st.dosage.split('|').map((s: string) => s.trim()).filter((s: string) => !!s)) {
				const id = +((((dosageStr.match(/^\d+\-/g))??[])[0]??'').replace('-','').trim()??'')
				const text = ((((dosageStr.match(/\-.+/gs))??[])[0]??'').replace(/^\-/g,'').trim()??'')

				if(id && text?.length){
					if(treatments[st.symptom_id][id]){
						treatments[st.symptom_id][id].dosagePDF = text
					}
					
				}
			}
		}

		if(st.additional_information?.length){
			for(const additionalInformationStr of st.additional_information.split('|').map((s: string) => s.trim()).filter((s: string) => !!s)) {
				const id = +((((additionalInformationStr.match(/^\d+\-/g))??[])[0]??'').replace('-','').trim()??'')
				const text = ((((additionalInformationStr.match(/\-.+/g))??[])[0]??'').replace(/^\-/g,'').trim()??'')

				if(id && text?.length){
					if(treatments[st.symptom_id][id]){
						treatments[st.symptom_id][id].additionalInformationPDF = text
					}
					else{
						console.log(additionalInformationStr);
						console.log(`NOT FOUND SYMPTOM ${st.symptom_id} TREATMENT ${id}`);
					}
				}
			}
		}

		if(st.expected_improvement?.length){
			for(const expectedImprovementStr of st.expected_improvement.split('|').map((s: string) => s.trim()).filter((s: string) => !!s)) {
				const id = +((((expectedImprovementStr.match(/^\d+\-/g))??[])[0]??'').replace('-','').trim()??'')
				const text = ((((expectedImprovementStr.match(/\-.+/g))??[])[0]??'').replace(/^\-/g,'').trim()??'')

				if(id && text?.length){
					if(treatments[st.symptom_id][id]){
						treatments[st.symptom_id][id].expectedImprovementPDF = text
					}
					else{
						console.log(expectedImprovementStr);
						console.log(`NOT FOUND SYMPTOM ${st.symptom_id} TREATMENT ${id}`);
					}
					
				}
			}
		}

		if(st.key_roles?.length){
			for(const keyRolesStr of st.key_roles.split('|').map((s: string) => s.trim()).filter((s: string) => !!s)) {
				const id = +((((keyRolesStr.match(/^\d+\-/g))??[])[0]??'').replace('-','').trim()??'')
				const text = ((((keyRolesStr.match(/\-.+/g))??[])[0]??'').replace(/^\-/g,'').trim()??'')

				if(id && text?.length){
					if(treatments[st.symptom_id][id]){
						treatments[st.symptom_id][id].keyRolesPDF = text
					}
					else{
						console.log(keyRolesStr);
						console.log(`NOT FOUND SYMPTOM ${st.symptom_id} TREATMENT ${id}`);
					}
					
				}
			}
		}
	}

	return treatments
}

function treatmentsSortAndSlice(treatments: any[]){
	return treatments.filter(t => (((t?.fromPDF) || (t?.mainArticles?.length)) && (t?.treatmentName !== 'date'))).sort((t1: any, t2: any) => {
		//if t2 is better than t1: return +1
		//if t1 is better than t2: return -1

		if((t1.fromPDF === true) && (t2.fromPDF === true)){
			if(t2.prioritizedTreatment && !t1.prioritizedTreatment){
				return +1
			}

			if(!t2.prioritizedTreatment && t1.prioritizedTreatment){
				return -1
			}
		}

		if((t1.fromPDF === false) && (t2.fromPDF === true)){
			return +1
		}

		if((t1.fromPDF === true) && (t2.fromPDF === false)){
			return -1
		}

		if((t2?.totalMainArticles??0) > (t1?.totalMainArticles??0)){
			return +1
		}
		else {
			return -1
		}		
	}).slice(0, 2)
}

async function setTreatmentsPreconditions(treatments: any[], preconditions:string[], symptomName: string,age: number, gender: string, symptoms: string[], freetext: string) {
	for(const treatment of treatments) {
		for(const precondition of preconditions) {					
			const articlesPrecondition = treatment?.mainArticles?.filter((a: any) => ((a?.gpt?.symptoms||{})[symptomName]||[]).filter((t: any) => (t?.preconditions||[]).includes(precondition)).length)

			if(articlesPrecondition?.length) {
				treatment.preconditions[precondition] = {
					numberOfArticles: articlesPrecondition?.length,
					bestArticle: null,
					preconditionName: precondition,
					articlesPrecondition
				}

				if(articlesPrecondition.length > 1){
					const query = `${getAgeGroup(age)} ${getGenderGroup(gender)} with ${symptoms.join(', ')} ${(preconditions??[]).join(', ')} ${freetext}`

					const sortedArticlesByTextSimilarity = await sortArticlesByTextSimilarity(articlesPrecondition,query, symptomName, treatment)

					treatment.preconditions[precondition].bestArticle = sortedArticlesByTextSimilarity[0]
				}
				else{
					treatment.preconditions[precondition].bestArticle = articlesPrecondition[0]
				}
			}
		}

		treatment.preconditions = Object.values(treatment.preconditions||{}) || []		
		treatment.preconditions = (treatment.preconditions.sort((a: any, b: any) => b.numberOfArticles - a.numberOfArticles)).slice(0,1)
	}
}

async function setBestArticle(treatments: any[], symptomName:string, age: number, gender: string, symptoms: string[], preconditions: string[], freetext: string){
	for(const treatment of treatments) {
		if(treatment?.mainArticles?.length) {
			if(treatment?.mainArticles?.length <= 1){
				treatment.bestMainFilteredArticle = treatment.mainArticles[0]
			}

			const query = `${getAgeGroup(age)} ${getGenderGroup(gender)} with ${symptoms.join(', ')} ${(preconditions??[]).join(', ')} ${freetext}`
			
			const sortedArticlesByTextSimilarity = await sortArticlesByTextSimilarity(treatment.mainArticles,query, symptomName, treatment.treatmentName)

			if(sortedArticlesByTextSimilarity?.length) {
				treatment.bestMainFilteredArticle = sortedArticlesByTextSimilarity[0]
			}
			else{
				treatment.bestMainFilteredArticle = treatment.mainArticles[0]
			}
		}
	}
}

const getSmartRecommendation4 = async (req: Request, res: Response) => {
	try {
		let { age, gender, symptoms, preconditions, freetext } = req.body

		age = (+age)||null
		gender = ((gender === 'male') || (gender === 'female'))? gender : null

		symptoms = (symptoms || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s).map((s: string) => +s)
		symptoms = symptoms?.length ? symptoms : null

		preconditions = (preconditions || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
		preconditions = preconditions?.length ? preconditions : []

		freetext = (freetext || '').trim()

		const output:any = {}

		const symptomsMaster = (await SymptomMaster.findAll({raw: true, where: {symptom_id: symptoms}})) || []

		console.log('symptomsMaster');
		console.log(symptomsMaster);

		const treatmentsMaster = (await TreatmentMaster.findAll({raw: true})) 

		for(const symptomId of symptoms) {
			const symptomName = symptomsMaster.find((s:any) => +s.symptom_id === symptomId)?.symptom_name??null

			const treatmentQuantityPerCategory = (((symptomsMaster.find((s:any) => +s.symptom_id === symptomId))??{})?.categories??'').split(';').filter((s: string) => s?.trim()?.length).map((s: string) => +s).reduce((acc: any, curr: number) => {
				if(!acc[curr]) {
					acc[curr] = {
						quantity: 0,
						treatments: []
					}
				}

				acc[curr].quantity++
				return acc
			}, {})

			const treatments = ((await SymptomTreatments.findAll({where: {symptom_id: symptomId}, raw: true}))??[]).filter((t: any) => !!t?.key_roles?.length && !!t?.expected_improvement?.length).map((t: any) => {
				const treatmentMaster = treatmentsMaster.find((tm: any) => tm?.treatment_id === t?.treatment_id)

				return {
					...t,
					treatment_name: treatmentMaster?.common_names || treatmentMaster?.treatment_name,
					categories: treatmentMaster?.categories??'',
					type: treatmentMaster?.treatment_type??''
				}
			})

			const treatmentsPerCategory:any = {}

			for(const treatment of treatments) {
				if((treatment?.type??'').toLowerCase().includes('vitamin') || (treatment?.type??'').toLowerCase().includes('herb') ) {
					treatment.type = 'supplement'
				}
				else{
					if((treatment?.type??'').toLowerCase().includes('food')) {
						treatment.type = 'food'
					}
					else{
						if((treatment?.type??'').toLowerCase().includes('lifestyle')) {
							treatment.type = 'lifestyle'
						}
						else{
							treatment.type = null
						}
					}
				}

				;(treatment?.categories??'').split(';').filter((s: string) => s?.trim()?.length).map((s: string) => +s).forEach((categoryId: number) => {
					if(!treatmentsPerCategory[categoryId]) {
						treatmentsPerCategory[categoryId] = []
					}

					treatmentsPerCategory[categoryId].push(treatment)
				})			
			}

			let supplementTreatments =  JSON.parse(JSON.stringify(treatments)).filter((t: any) => t?.type === 'supplement')
			let foodTreatments = treatments.filter((t: any) => t?.type === 'food')
			let lifestyleTreatments = treatments.filter((t: any) => t?.type === 'lifestyle')

			foodTreatments.sort((a: any, b: any) => {
				return b?.articles?.length - a?.articles?.length
			})

			lifestyleTreatments.sort((a: any, b: any) => {
				return b?.articles?.length - a?.articles?.length
			})

			supplementTreatments.sort((a: any, b: any) => {
				return b?.articles?.length - a?.articles?.length
			})

			foodTreatments = foodTreatments.slice(0,4)
			lifestyleTreatments = lifestyleTreatments.slice(0,2)

			const allTreatments: any[] = []

			for(const categoryId in treatmentQuantityPerCategory) {
				treatmentQuantityPerCategory[categoryId].treatments = treatmentsPerCategory[categoryId]??null

				if(treatmentQuantityPerCategory[categoryId].treatments?.length) {
					treatmentQuantityPerCategory[categoryId].treatments = treatmentQuantityPerCategory[categoryId].treatments.sort((a: any, b: any) => {

						//if both have 3 or more articles, prioritize the one with pdf or food id if both have use the article length
						//else use the article length
						// if((b?.articles?.length??0) > (a?.articles?.length??0)){
						// 	return 1
						// }
						
						// if((b?.articles?.length??0) < (a?.articles?.length??0)){
						// 	return -1
						// }

						// return 0
						return b?.articles?.length - a?.articles?.length
					})//.slice(0,treatmentQuantityPerCategory[categoryId]?.quantity??1)
					
				}
			}

			let treatmentQuantityPerCategoryArr = Object.keys(treatmentQuantityPerCategory).map((categoryId: string) => ({
				categoryId: +categoryId,
				treatmentLength: treatmentQuantityPerCategory[categoryId]?.treatments?.length??0,
				...treatmentQuantityPerCategory[categoryId]
			}))

			treatmentQuantityPerCategoryArr = treatmentQuantityPerCategoryArr.sort((a: any, b: any) => a.treatmentLength - b.treatmentLength)

			const selectedTreatmentIds:number[] = []

			for(const category of treatmentQuantityPerCategoryArr) {				
				category.selectedTreatments = []

				while ((category.quantity > 0) && (category.treatments?.length > 0)) {
					const treatment = category.treatments.shift()

					if(!selectedTreatmentIds.includes(+treatment.treatment_id)) {
						category.selectedTreatments.push(treatment)
						selectedTreatmentIds.push(+treatment.treatment_id)
						category.quantity--
					}
				}
			}

			for(const category of treatmentQuantityPerCategoryArr) {
				if(category.selectedTreatments?.length) {
					allTreatments.push(...category.selectedTreatments)
				}
			}

			if(allTreatments.length < 4) {
				const allTreatmentsIds = allTreatments.map((t: any) => +t.treatment_id)
				supplementTreatments = supplementTreatments.filter((t: any) => !allTreatmentsIds.includes(+t.treatment_id))

				allTreatments.push(...supplementTreatments.slice(0,4 - allTreatments.length))
			}
			
			allTreatments.push(...foodTreatments)
			allTreatments.push(...lifestyleTreatments)

			const allTreatmentsPerType:any = {
				supplement: [],
				food: [],
				lifestyle: []
			}


			for(const treatment of allTreatments) {
				treatment.totalArticles = await getTotalArticles(symptomName, treatment.treatment_name)

				if(treatment?.articles?.length){
					if(treatment?.forbidden_articles?.length){
						const forbiddenArticlesIds = treatment.forbidden_articles.split(',').map((s: string) => +s)

						treatment.articles = treatment.articles.filter((a: any) => !forbiddenArticlesIds.includes(+a.articlePubmedId))
					}


					for(const article of treatment.articles) {
						if(article?.isOwn === true){
							article.isQuality = true

							article.treatment.howMuch = article?.gpt4?.howMuch || article.treatment.howMuch
							article.treatment.keyRoles = article?.gpt4?.keyRoles || article.treatment.keyRoles
							article.treatment.recommendedDosage = article?.gpt4?.recommendedDosage || article.treatment.recommendedDosage
						}
						else{
							if(article.gpt4){
								article.isQuality = true
								article.treatment.howMuch = article?.gpt4?.howMuch || article.treatment.howMuch
								article.treatment.keyRoles = article?.gpt4?.keyRoles || article.treatment.keyRoles
								article.treatment.recommendedDosage = article?.gpt4?.recommendedDosage || article.treatment.recommendedDosage
							}
							else{
								article.isQuality = false
							}					
						}
					}

					console.log('TOTAL ARTICLES: ', treatment.articles.length);
					console.log('IS QUALITY ARTICLES: ', treatment.articles.filter((a: any) => a?.isQuality).length);

					for(const article of (treatment?.articles??[])) {
						if((article?.treatment?.howMuch??'').match(/does.*not.*provide.*expected.*improvement/gi)){
							delete article.treatment.howMuch
						}
					}

					treatment.articles = treatment.articles.filter((a: any) => a?.isQuality && a?.articleTitle?.length)
				}

				// if(treatment?.articles?.length > 3) {
				// 	const query = `${getAgeGroup(age)} ${getGenderGroup(gender)} with ${symptoms.join(', ')} ${(preconditions??[]).join(', ')} ${freetext}`
			
				// 	treatment.articles = await sortArticlesByTextSimilarity2(treatment.articles ,query, symptomName, treatment.treatment_name)
				// }

				if(treatment.type === 'supplement') {
					allTreatmentsPerType.supplement.push(treatment)
				}
				else{
					if(treatment.type === 'food') {
						allTreatmentsPerType.food.push(treatment)
					}
					else{
						if(treatment.type === 'lifestyle') {
							allTreatmentsPerType.lifestyle.push(treatment)
						}
					}
				}
			}
			
			output[symptomName] = {treatmentQuantityPerCategory, treatments: allTreatmentsPerType, symptomId, treatmentQuantityPerCategoryArr}
		}

		return res.json(output)


		
		// const symptomsFoods = ((await SymptomFoods.findAll({raw: true}))||[]).reduce((acc: any, s: any) => {
		// 	acc[+s.symptom_id] = (s.foods??'').split('|').map((s: string) => s.trim()).filter((s: string) => !!s)
		// 	return acc
		// }, {})

		// const symptomsMaster_ = (await SymptomMaster.findAll({raw: true})) 
		
		// const symptomsMasterIds = symptomsMaster_.reduce((acc: any, s: any) => {
		// 	acc[+s.symptom_id] = s.symptom_name
		// 	return acc
		// }, {})

		// const symptomsMasterNames = symptomsMaster_.reduce((acc: any, s: any) => {
		// 	acc[s.symptom_name] = +s.symptom_id
		// 	return acc
		// }, {})


		// const treatmentsMaster = (await TreatmentMaster.findAll({raw: true})) 

		// const treatmentsMasterNames = treatmentsMaster.reduce((acc:any, t:any) => {
		// 	if(t?.treatment_name?.length){
		// 		acc[t.treatment_name] = {
		// 			id: +t.treatment_id,
		// 			type: t.treatment_type,
		// 			name: t.treatment_name,
		// 			commonNames: t.common_names,
		// 		}
		// 	}

		// 	if(t?.treatment_synonyms?.length){
		// 		for(const synonym of t.treatment_synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => !!s)) {
		// 			acc[synonym] = {
		// 				id: +t.treatment_id,
		// 				type: t.treatment_type,
		// 				name: t.treatment_name,
		// 				commonNames: t.common_names,
		// 			}
		// 		}
		// 	}	
		// 		return acc
		// 	}, {})


		// const treatmentsMasterIds = treatmentsMaster.reduce((acc:any, t:any) => {
		// 	if(t?.treatment_name?.length){
		// 		acc[+t.treatment_id] = {
		// 			id: +t.treatment_id,
		// 			type: t.treatment_type,
		// 			name: t.treatment_name,
		// 		}
		// 	}
		// 		return acc
		// 	}, {})

		// const treatmentsFromPDF = await getTreatmentsFromPDF(treatmentsMasterIds)	

	

		// const output:any = {}

		// for(const symptomId of symptoms) {
		// 	const symptomName = symptomsMasterIds[symptomId]

		// 	const articles = await findArticles(age, gender, symptomName)

		// 	const treatments:any = treatmentsFromPDF[symptomId] ?? {}
	
		// 	for(const article of articles){
		// 		for(const articleTreatment of ((article?.gpt?.symptoms??{})[symptomName] || [])){
		// 		  if(articleTreatment?.treatment){
		// 			const treatmentId = +treatmentsMasterNames[articleTreatment?.treatment]?.id

		// 			if(!treatments[treatmentId]){
		// 				treatments[treatmentId] = {
		// 					treatmentName: treatmentsMasterNames[articleTreatment?.treatment]?.commonNames,
		// 					treatmentId: treatmentsMasterNames[articleTreatment?.treatment]?.id,
		// 					treatmentType: treatmentsMasterNames[articleTreatment?.treatment]?.type,
		// 					totalArticles: 0,
		// 					totalMainArticles: 0,
		// 					bestMainFilteredArticle: null,
		// 					preconditions: {},
		// 					mainArticles: [],
		// 					filteredArticles: [],
		// 					fromPDF: false,
		// 					prioritizedTreatment: false,
		// 					dosagePDF: null,
		// 					additionalInformationPDF: null,
		// 					expectedImprovementPDF: null,
		// 					keyRolesPDF: null
		// 				}
		// 			}
		  
		// 			treatments[treatmentId].totalArticles++

		// 			if(articleTreatment?.mainSymptomTreatment === true){
		// 				article.howMuch = articleTreatment?.howMuch
		// 				article.keyRoles = articleTreatment?.keyRoles
		// 				article.recommendedDosage = articleTreatment?.recommendedDosage
		// 				treatments[treatmentId].totalMainArticles++
		// 				treatments[treatmentId].mainArticles.push(article)
		// 			}
		// 		  }
		// 		}
		// 	}

		// 	let foods = treatmentsSortAndSlice(Object.values(treatments).filter((treatment: any) => treatment.treatmentType === 'food'))
		// 	const vitamins = treatmentsSortAndSlice(Object.values(treatments).filter((treatment: any) => treatment.treatmentType === 'vitamin'))
		// 	const herbs = treatmentsSortAndSlice(Object.values(treatments).filter((treatment: any) => treatment.treatmentType === 'herb'))
		// 	const lifestyle = treatmentsSortAndSlice(Object.values(treatments).filter((treatment: any) => treatment.treatmentType === 'lifestyle'))
	
		// 	await setTreatmentsPreconditions(foods, preconditions, symptomName, age, gender, symptoms, freetext)
		// 	await setTreatmentsPreconditions(vitamins, preconditions, symptomName, age, gender, symptoms, freetext)
		// 	await setTreatmentsPreconditions(herbs, preconditions, symptomName, age, gender, symptoms, freetext)
		// 	await setTreatmentsPreconditions(lifestyle, preconditions, symptomName, age, gender, symptoms, freetext)
			
		// 	await setBestArticle(foods, symptomName, age, gender, symptoms, preconditions, freetext)
		// 	await setBestArticle(vitamins, symptomName, age, gender, symptoms, preconditions, freetext)
		// 	await setBestArticle(herbs, symptomName, age, gender, symptoms, preconditions, freetext)
		// 	await setBestArticle(lifestyle, symptomName, age, gender, symptoms, preconditions, freetext)

		// 	if(symptomsFoods && symptomsFoods[+symptomId]?.length){
		// 		const additionalFoods = symptomsFoods[+symptomId].map((f:any) => ({
		// 			treatmentName: f,
		// 			treatmentId: null,
		// 			treatmentType: 'food',
		// 			totalArticles: 0,
		// 			totalMainArticles: 0,
		// 			bestMainFilteredArticle: null,
		// 			preconditions: {},
		// 			mainArticles: [],
		// 			filteredArticles: [],
		// 			fromPDF: false,
		// 			prioritizedTreatment: false,
		// 			dosagePDF: null,
		// 			additionalInformationPDF: null,
		// 			expectedImprovementPDF: null,
		// 			keyRolesPDF: null
		// 		}))
	
		// 		foods = [...foods, ...additionalFoods].splice(0, 6)
		// 	}

		// 	output[symptomName] = {foods, vitamins, herbs, lifestyle, symptomsFoods}
		// }

		// return res.json(output)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

async function getTotalArticles(symptom: string, treatment: string){	
	const articles = (await MedicineArticlesProcessed.findAll({
		where: {
			[Op.and]: [
				{symptoms: {[Op.like]: `%${symptom}%`}},
				{treatments: {[Op.like]: `%${treatment}%`}}
			]
		},
		raw: true
	})??[])

	return articles.length
}


const getSmartRecommendation5 = async (req: Request, res: Response) => {
	try {
		let { main_symptoms_conditions, other_symptoms_conditions, symptom_conditions_matches, possible_conditions  } = req.body

		console.log('getSmartRecommendation5');
		
		console.log('main_symptoms_conditions');
		console.log(main_symptoms_conditions);

		console.log('other_symptoms_conditions');
		console.log(other_symptoms_conditions);

		console.log('symptom_conditions_matches');
		console.log(symptom_conditions_matches);

		console.log('possible_conditions');
		console.log(possible_conditions);

		const allSymptomsAndConditions = _.uniq([...main_symptoms_conditions, ...other_symptoms_conditions])
		
		const treatmentsById = ((await TreatmentMaster.findAll({raw: true}))||[]).reduce((acc: any, t: any) => {
			acc[+t.treatment_id] = {
				...t
			}

			return acc
		}, {})

		const symptomsById = ((await SymptomConditionMaster.findAll({raw: true}))||[]).reduce((acc: any, s: any) => {
			acc[+s.symptom_id] = {
				...s
			}

			return acc
		}, {})

		const symptomsTreatments = ((await SymptomTreatments.findAll({raw: true}))||[]).map((st: any) => ({
			...st,
			articles: (st.articles??[]).map((a: any) => ({
				url: a.url,
				title: a.title,
				articlePubmedId: a.pubmed_id,
				mainSymptomTreatment: true
			}))
		}))

		const symptomTreatmentsHumata = await SymptomTreatmentsHumata.findAll({raw: true})


		main_symptoms_conditions = main_symptoms_conditions.map((symptomId: any) => {
			const symptom = symptomsById[+symptomId]
			return {
				symptomId,
				symptom,
				treatments: [
					...symptomsTreatments.filter((st: any) => (+st.symptom_id === +symptomId) && ((st.condition_id === null) || (st.condition_id === +symptomId))),
					...symptomsTreatments.filter((st: any) => (+st.condition_id === +symptomId) && ((st.symptom_id === null) || (st.symptom_id === +symptomId))),
				].map((t: any) => ({
					...t,
					...(treatmentsById[+t.treatment_id]??{})
				})),
			//	foods_increase: _.flatten(symptomTreatmentsHumata.filter((st: any) => ((st?.symptom_name === symptom?.symptom_name) && (!st?.condition_name)) || ((st?.condition_name === symptom?.symptom_name) && (!st?.symptom_name))).map((st: any) => st?.treatments?.foods_increase).filter((s: any) => s?.length)),
			//	foods_decrease: _.flatten(symptomTreatmentsHumata.filter((st: any) => ((st?.symptom_name === symptom?.symptom_name) && (!st?.condition_name)) || ((st?.condition_name === symptom?.symptom_name) && (!st?.symptom_name))).map((st: any) => st?.treatments?.foods_decrease).filter((s: any) => s?.length)),
			}
		})

		other_symptoms_conditions = other_symptoms_conditions.map((symptomId: any) => {
			const symptom = symptomsById[+symptomId]
			
			return {
				symptomId,
				symptom,
				treatments: [
					...symptomsTreatments.filter((st: any) => (+st.symptom_id === +symptomId) && ((st.condition_id === null) || (st.condition_id === +symptomId))),
					...symptomsTreatments.filter((st: any) => (+st.condition_id === +symptomId) && ((st.symptom_id === null) || (st.symptom_id === +symptomId))),
				].map((t: any) => ({
					...t,
					...(treatmentsById[+t.treatment_id]??{})
				})),
			//	foods_increase: _.flatten(symptomTreatmentsHumata.filter((st: any) => ((st?.symptom_name === symptom?.symptom_name) && (!st?.condition_name)) || ((st?.condition_name === symptom?.symptom_name) && (!st?.symptom_name))).map((st: any) => st?.treatments?.foods_increase).filter((s: any) => s?.length)),
			//	foods_decrease: _.flatten(symptomTreatmentsHumata.filter((st: any) => ((st?.symptom_name === symptom?.symptom_name) && (!st?.condition_name)) || ((st?.condition_name === symptom?.symptom_name) && (!st?.symptom_name))).map((st: any) => st?.treatments?.foods_decrease).filter((s: any) => s?.length)),
			}
		})

		possible_conditions = possible_conditions.map((symptomId: any) => {
			const symptom = symptomsById[+symptomId]

			return {
				symptomId,
				symptom,
				treatments: [
					...symptomsTreatments.filter((st: any) => (+st.symptom_id === +symptomId) && ((st.condition_id === null) || (st.condition_id === +symptomId))),
					...symptomsTreatments.filter((st: any) => (+st.condition_id === +symptomId) && ((st.symptom_id === null) || (st.symptom_id === +symptomId))),
				].map((t: any) => ({
					...t,
					...(treatmentsById[+t.treatment_id]??{})
				})),
			//	foods_increase: _.flatten(symptomTreatmentsHumata.filter((st: any) => ((st?.symptom_name === symptom?.symptom_name) && (!st?.condition_name)) || ((st?.condition_name === symptom?.symptom_name) && (!st?.symptom_name))).map((st: any) => st?.treatments?.foods_increase).filter((s: any) => s?.length)),
			//	foods_decrease: _.flatten(symptomTreatmentsHumata.filter((st: any) => ((st?.symptom_name === symptom?.symptom_name) && (!st?.condition_name)) || ((st?.condition_name === symptom?.symptom_name) && (!st?.symptom_name))).map((st: any) => st?.treatments?.foods_decrease).filter((s: any) => s?.length)),
			}
		})

		// symptom_conditions_matches = symptom_conditions_matches.map((symptomCondition: any) => {
		// 	const symptom = symptomsById[+symptomCondition.symptom_id]
		// 	const condition = symptomsById[+symptomCondition.condition_id]

		// 	return {
		// 		symptomId: symptomCondition.symptom_id,
		// 		conditionId: symptomCondition.condition_id,
		// 		symptom,
		// 		condition,
		// 		treatments: [
		// 			...symptomsTreatments.filter((st: any) => (+st.symptom_id === +symptomCondition.symptom_id) && (st.condition_id === symptomCondition.condition_id)),					
		// 		].map((t: any) => ({
		// 			...t,
		// 			...(treatmentsById[+t.treatment_id]??{})
		// 		})),
		// 		foods_increase: _.flatten(symptomTreatmentsHumata.filter((st: any) => ((st?.symptom_name === symptom?.symptom_name) && (st?.condition_name === condition?.symptom_name))).map((st: any) => st?.treatments?.foods_increase).filter((s: any) => s?.length && (s.includes(',') || s.includes(';')))),
		// 		foods_decrease: _.flatten(symptomTreatmentsHumata.filter((st: any) => ((st?.symptom_name === symptom?.symptom_name) && (st?.condition_name === condition?.symptom_name))).map((st: any) => st?.treatments?.foods_decrease).filter((s: any) => s?.length && (s.includes(',') || s.includes(';')))),
		// 	}
		// })

		symptom_conditions_matches = []

		for(const scId1 of allSymptomsAndConditions){
			for(const scId2 of allSymptomsAndConditions){
				console.log(scId1, scId2);
				
				if(+scId1 === +scId2){
					continue
				}

				if(symptom_conditions_matches.find((sc: any) => (+sc.symptomId === +scId1) && (+sc.conditionId === +scId2)) || symptom_conditions_matches.find((sc: any) => (+sc.symptomId === +scId2) && (+sc.conditionId === +scId1))){
					continue
				}

				const treatments = [
					...symptomsTreatments.filter((st: any) => (+st.symptom_id === +scId1) && (st.condition_id === +scId2)),
					...symptomsTreatments.filter((st: any) => (+st.symptom_id === +scId2) && (st.condition_id === +scId1))
				]

				const sc1 = symptomsById[+scId1]
				const sc2 = symptomsById[+scId2]

				if(treatments.length && sc1 && sc2){
					if(sc1.symptom_type === 'condition'){
						symptom_conditions_matches.push({
							symptomId: scId2,
							conditionId: scId1,
							symptom: sc2,
							condition: sc1,
							treatments
						})
					}
					else{
						symptom_conditions_matches.push({
							symptomId: scId1,
							conditionId: scId2,
							symptom: sc1,
							condition: sc2,
							treatments
						})
					}
				}
			}
		}
		
		
		return res.json({main_symptoms_conditions, other_symptoms_conditions, symptom_conditions_matches, possible_conditions})		
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

const getSmartRecommendation3 = async (req: Request, res: Response) => {
	try {
		const symptomsFoods = ((await SymptomFoods.findAll({raw: true}))||[]).reduce((acc: any, s: any) => {
			acc[+s.symptom_id] = (s.foods??'').split('|').map((s: string) => s.trim()).filter((s: string) => !!s)
			return acc
		}, {})

		const symptomsMaster_ = (await SymptomMaster.findAll({raw: true})) 
		
		const symptomsMasterIds = symptomsMaster_.reduce((acc: any, s: any) => {
			acc[+s.symptom_id] = s.symptom_name
			return acc
		}, {})

		const symptomsMasterNames = symptomsMaster_.reduce((acc: any, s: any) => {
			acc[s.symptom_name] = +s.symptom_id
			return acc
		}, {})


		const treatmentsMaster = (await TreatmentMaster.findAll({raw: true})) 

		const treatmentsMasterNames = treatmentsMaster.reduce((acc:any, t:any) => {
			if(t?.treatment_name?.length){
				acc[t.treatment_name] = {
					id: +t.treatment_id,
					type: t.treatment_type,
					name: t.treatment_name,
					commonNames: t.common_names,
				}
			}

			if(t?.treatment_synonyms?.length){
				for(const synonym of t.treatment_synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => !!s)) {
					acc[synonym] = {
						id: +t.treatment_id,
						type: t.treatment_type,
						name: t.treatment_name,
						commonNames: t.common_names,
					}
				}
			}	
				return acc
			}, {})


		const treatmentsMasterIds = treatmentsMaster.reduce((acc:any, t:any) => {
			if(t?.treatment_name?.length){
				acc[+t.treatment_id] = {
					id: +t.treatment_id,
					type: t.treatment_type,
					name: t.treatment_name,
				}
			}
				return acc
			}, {})

		const treatmentsFromPDF = await getTreatmentsFromPDF(treatmentsMasterIds)	

		let { age, gender, symptoms, preconditions, freetext } = req.body

		age = (+age)||null
		gender = ((gender === 'male') || (gender === 'female'))? gender : null

		symptoms = (symptoms || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s).map((s: string) => +s)
		symptoms = symptoms?.length ? symptoms : null

		preconditions = (preconditions || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
		preconditions = preconditions?.length ? preconditions : []

		freetext = (freetext || '').trim()

		const output:any = {}

		for(const symptomId of symptoms) {
			const symptomName = symptomsMasterIds[symptomId]

			const articles = await findArticles(age, gender, symptomName)

			const treatments:any = treatmentsFromPDF[symptomId] ?? {}
	
			for(const article of articles){
				for(const articleTreatment of ((article?.gpt?.symptoms??{})[symptomName] || [])){
				  if(articleTreatment?.treatment){
					const treatmentId = +treatmentsMasterNames[articleTreatment?.treatment]?.id

					if(!treatments[treatmentId]){
						treatments[treatmentId] = {
							treatmentName: treatmentsMasterNames[articleTreatment?.treatment]?.commonNames,
							treatmentId: treatmentsMasterNames[articleTreatment?.treatment]?.id,
							treatmentType: treatmentsMasterNames[articleTreatment?.treatment]?.type,
							totalArticles: 0,
							totalMainArticles: 0,
							bestMainFilteredArticle: null,
							preconditions: {},
							mainArticles: [],
							filteredArticles: [],
							fromPDF: false,
							prioritizedTreatment: false,
							dosagePDF: null,
							additionalInformationPDF: null,
							expectedImprovementPDF: null,
							keyRolesPDF: null
						}
					}
		  
					treatments[treatmentId].totalArticles++

					if(articleTreatment?.mainSymptomTreatment === true){
						article.howMuch = articleTreatment?.howMuch
						article.keyRoles = articleTreatment?.keyRoles
						article.recommendedDosage = articleTreatment?.recommendedDosage
						treatments[treatmentId].totalMainArticles++
						treatments[treatmentId].mainArticles.push(article)
					}
				  }
				}
			}

			let foods = treatmentsSortAndSlice(Object.values(treatments).filter((treatment: any) => treatment.treatmentType === 'food'))
			const vitamins = treatmentsSortAndSlice(Object.values(treatments).filter((treatment: any) => treatment.treatmentType === 'vitamin'))
			const herbs = treatmentsSortAndSlice(Object.values(treatments).filter((treatment: any) => treatment.treatmentType === 'herb'))
			const lifestyle = treatmentsSortAndSlice(Object.values(treatments).filter((treatment: any) => treatment.treatmentType === 'lifestyle'))
	
			await setTreatmentsPreconditions(foods, preconditions, symptomName, age, gender, symptoms, freetext)
			await setTreatmentsPreconditions(vitamins, preconditions, symptomName, age, gender, symptoms, freetext)
			await setTreatmentsPreconditions(herbs, preconditions, symptomName, age, gender, symptoms, freetext)
			await setTreatmentsPreconditions(lifestyle, preconditions, symptomName, age, gender, symptoms, freetext)
			
			await setBestArticle(foods, symptomName, age, gender, symptoms, preconditions, freetext)
			await setBestArticle(vitamins, symptomName, age, gender, symptoms, preconditions, freetext)
			await setBestArticle(herbs, symptomName, age, gender, symptoms, preconditions, freetext)
			await setBestArticle(lifestyle, symptomName, age, gender, symptoms, preconditions, freetext)

			if(symptomsFoods && symptomsFoods[+symptomId]?.length){
				const additionalFoods = symptomsFoods[+symptomId].map((f:any) => ({
					treatmentName: f,
					treatmentId: null,
					treatmentType: 'food',
					totalArticles: 0,
					totalMainArticles: 0,
					bestMainFilteredArticle: null,
					preconditions: {},
					mainArticles: [],
					filteredArticles: [],
					fromPDF: false,
					prioritizedTreatment: false,
					dosagePDF: null,
					additionalInformationPDF: null,
					expectedImprovementPDF: null,
					keyRolesPDF: null
				}))
	
				foods = [...foods, ...additionalFoods].splice(0, 6)
			}

			output[symptomName] = {foods, vitamins, herbs, lifestyle, symptomsFoods}
		}

		return res.json(output)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

  const getSmartRecommendation = async (req: Request, res: Response) => {
	try {
		let { age, gender, symptoms, preconditions, freetext } = req.body

		age = (+age)||null
		gender = ((gender === 'male') || (gender === 'female'))? gender : null

		symptoms = (symptoms || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
		symptoms = symptoms?.length ? symptoms : null

		preconditions = (preconditions || '').split(',').map((s: string) => s.trim()).filter((s: string) => !!s)
		preconditions = preconditions?.length ? preconditions : null

		freetext = (freetext || '').trim()

		const output:any = {}

		for(const symptom of symptoms) {
			const articles = await findArticles(age, gender, symptom)

			const totalArticlesPerTreatment = getTotalArticlesPerTreatment(articles, symptom)

			const totalArticlesLength = articles.length

			let mainArticles = (articles.filter((a: any) => (a?.gpt?.symptoms||{})[symptom].filter((t: any) => t?.mainSymptomTreatment === true)?.length))||[]

			const mainArticlesLength = mainArticles.length

			const filteredArticles = filterArticles(mainArticles, symptoms, preconditions)

			const filteredArticlesLength = filteredArticles.length

			if(gender === 'male') {
				gender = 'men/man/male'
			}

			if(gender === 'female'){
				gender = 'women/woman/female'
			}

			const query = `${getAgeGroup(age)} ${gender} with ${symptoms.join(', ')} ${(preconditions??[]).join(', ')} ${freetext}`

			const articlesSortedByTextSimilarity = await sortArticlesByTextSimilarity(filteredArticles,query)

			const articlesAfterTextSimilarityFilterLength = articlesSortedByTextSimilarity.length

			let treatments = getTreatments(articlesSortedByTextSimilarity, symptom)

			calculateNumberOfArticlesScore(treatments)
			calculateQualityScore(treatments)
			calculatePreconditionsSimilarityScore(treatments, preconditions, symptom)
			calculateOverallScore(treatments)
			
			treatments = Object.values(treatments).filter((t: any) => t?.articles?.length)

			treatments = treatments.filter((t: any) => t?.treatmentName !== 'date')

			treatments = _.orderBy(treatments, ['overallScore'], ['desc']).slice(0,4)

			//await sortTreatmentArticles(treatments,age, gender, symptoms, preconditions, freetext)

			treatments = treatments.map((treatment: any) => ({
				...treatment,
				articleUrl: treatment.articles[0]?.url,
				articleTitle: treatment.articles[0]?.title,
				articleHowMuch: (((treatment.articles[0]??{})?.gpt?.symptoms??{})[symptom]??[]).find((t: any) => t?.treatment === treatment.treatmentName)?.howMuch,
				articleKeyRoles: (((treatment.articles[0]??{})?.gpt?.symptoms??{})[symptom]??[]).find((t: any) => t?.treatment === treatment.treatmentName)?.keyRoles,
				articleSuccessRate: (((treatment.articles[0]??{})?.gpt?.symptoms??{})[symptom]??[]).find((t: any) => t?.treatment === treatment.treatmentName)?.successRate??null,
				articleNumberOfParticipants: (treatment.articles[0]??{})?.gpt?.numberOfParticipants??null,
				totalArticles: totalArticlesPerTreatment[treatment.treatmentName]??0
			}))

			output[symptom] = {
				symptomName: symptom,
				treatments,
				totalArticlesLength,
				mainArticlesLength,
				filteredArticlesLength,
				articlesAfterTextSimilarityFilterLength,
				query,
				articles,
				mainArticles,
				filteredArticles,
				articlesSortedByTextSimilarity,
			}
		}

		return res.json(output)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

function getGenderGroup(gender: string){
	if(gender === 'male') {
		return 'men man male'
	}

	if(gender === 'female'){
		return 'women woman female'
	}

	return ''
}

function getAgeGroup(age: number){
	// 0-1 years old - infant, baby
	// 0-5 years old - children, toddler, kids, child
	// 0-10 years old - children, kids, child
	// 10-18 years old - adolescent, children, child, kid
	// 13-18 years old - teenager
	// 18 and up - adult
	// 35-44 years old - early middle age
	// 45-64 years old - late middle age
	// 65 and up - older adult, late adulthood

	const ageGroup = [
		{ name: 'infant, baby', min: 0, max: 1 },
		{ name: 'children, toddler, kids, child', min: 0, max: 5 },
		{ name: 'children, kids, child', min: 0, max: 10 },
		{ name: 'adolescent, children, child, kid', min: 10, max: 18 },
		{ name: 'teenager', min: 13, max: 18 },
		{ name: 'adult', min: 18, max: 200 },
		{ name: 'adults', min: 18, max: 200 },
		{ name: 'early middle age', min: 35, max: 44 },
		{ name: 'late middle age', min: 45, max: 64 },
		{ name: 'older adult, late adulthood', min: 65, max: 200 },
	]

	return ageGroup.filter((a: any) => (age >= a.min) && (age <= a.max)).map((a: any) => a.name).join(', ')
}

function filterTreatmentArticles(treatments: any, symptoms: any, preconditions: any){	
	let allPreconditions = _.uniq(_.flatten([...Object.keys(preconditionsList.preconditions), ...Object.values(preconditionsList.preconditions)]))

	let symptomsSynonyms = _.uniq([...symptoms, ..._.flatten(symptoms.map((s: string) => (preconditionsList.preconditions as any)[s]||[]))])
	let preconditionsSynonyms = _.uniq([...preconditions, ..._.flatten(preconditions.map((p: string) => (preconditionsList.preconditions as any)[p]||[]))])

	allPreconditions = _.difference(allPreconditions, symptomsSynonyms)
	allPreconditions = _.difference(allPreconditions, preconditionsSynonyms)

	allPreconditions = allPreconditions.filter((p: string) => p.length >= 4)
	
	for(const treatmentName in treatments){
		const treatment = treatments[treatmentName]
		treatment.articles = (treatment.articles||[]).filter((article: any) => _.difference(Object.keys(article?.gpt?.symptoms??{}), symptoms).length === 0)
		treatment.articles = (treatment.articles||[]).filter((article: any) => _.difference((article?.preconditions??'').split(',').map((p:string) => p.trim()).filter((p:string) => !!p), preconditions).length === 0)
		
		treatment.articles = (treatment.articles||[]).filter((article: any) => {
			return !_.some(allPreconditions, (p: string) => (article?.title??'').toLowerCase().includes(p.toLowerCase()))
		})
	}
}

function filterArticles(articles: any, symptoms: any, preconditions: any){
	if(!preconditions){
		preconditions = []
	}

	let allPreconditions = _.uniq(_.flatten([...Object.keys(preconditionsList.preconditions), ...Object.values(preconditionsList.preconditions)]))

	let symptomsSynonyms = _.uniq([...symptoms, ..._.flatten(symptoms.map((s: string) => (preconditionsList.preconditions as any)[s]||[]))])
	let preconditionsSynonyms = _.uniq([...preconditions, ..._.flatten(preconditions.map((p: string) => (preconditionsList.preconditions as any)[p]||[]))])

	allPreconditions = _.difference(allPreconditions, symptomsSynonyms)
	allPreconditions = _.difference(allPreconditions, preconditionsSynonyms)

	allPreconditions = allPreconditions.filter((p: string) => p.length >= 4)
	
	articles = (articles||[]).filter((article: any) => _.difference(Object.keys(article?.gpt?.symptoms??{}), symptoms).length === 0)
	articles = (articles||[]).filter((article: any) => _.difference((article?.preconditions??'').split(',').map((p:string) => p.trim()).filter((p:string) => !!p), preconditions).length === 0)

	return articles = (articles || []).filter((article: any) => {
      return !_.some(allPreconditions, (p: string) => ((article?.title??'').replace(/\’/g,"'")).toLowerCase().includes(p.toLowerCase()))
	 })	
}

// function filterArticlesOnlyTitle(articles: any, symptoms: any, preconditions: any){
// 	// if(!preconditions){
// 	// 	preconditions = []
// 	// }

// 	// let allPreconditions = _.uniq(_.flatten([...Object.keys(preconditionsList.preconditions), ...Object.values(preconditionsList.preconditions)]))

// 	// let symptomsSynonyms = _.uniq([...symptoms, ..._.flatten(symptoms.map((s: string) => (preconditionsList.preconditions as any)[s]||[]))])
// 	// let preconditionsSynonyms = _.uniq([...preconditions, ..._.flatten(preconditions.map((p: string) => (preconditionsList.preconditions as any)[p]||[]))])

// 	// allPreconditions = _.difference(allPreconditions, symptomsSynonyms)
// 	// allPreconditions = _.difference(allPreconditions, preconditionsSynonyms)

// 	// allPreconditions = allPreconditions.filter((p: string) => p.length >= 4)
	
// 	return articles = (articles || [])
	
// 	// .filter((article: any) => {
// 	// 	console.log(`${article?.title} ===>>> ${!_.some(allPreconditions, (p: string) => ((article?.title??'').replace(/\’/g,"'")).toLowerCase().includes(p.toLowerCase()))}`);
// 	// 	if(!_.some(allPreconditions, (p: string) => ((article?.title??'').replace(/\’/g,"'")).toLowerCase().includes(p.toLowerCase())) == false){
// 	// 		for(const p of allPreconditions){
// 	// 			if(((article?.title??'').replace(/\’/g,"'")).toLowerCase().includes(p.toLowerCase())){
// 	// 				console.log(`INCLUDES: ${p}`);					
// 	// 			}
// 	// 		}
// 	// 	}
//     //   return !_.some(allPreconditions, (p: string) => ((article?.title??'').replace(/\’/g,"'")).toLowerCase().includes(p.toLowerCase()))
// 	//  })
	 
// 	 .filter((article: any) => ((article?.title??'').match(/\srats\s/gi)??[]).length === 0)	
// }

async function sortArticlesByTextSimilarity(articles: any[], query: string, symptomName: string|null = null, treatment: string|null = null){
	const articlesQuery = articles.reduce((acc: any, article: any) => {
		if(symptomName && treatment){
			const expectedImprovement = (((article?.gpt?.symptoms??{})[symptomName]??[]).find((t:any) => t.treatment === treatment)??{})?.howMuch??''
			const keyRoles = ((((article?.gpt?.symptoms??{})[symptomName]??[]).find((t:any) => t.treatment === treatment)??{})?.keyRoles??[]).join('\n')
			
			acc[article.pubmed_id] = article.title+' \n '+expectedImprovement+' \n '+keyRoles
		}
		else{
			acc[article.pubmed_id] = article.title
		}
		
		return acc
	},{})

	try{
		const body = {
			query_info: query,
			articles: articlesQuery,
		}

		const result = await axios.post('https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/data-models/top-articles', body)

		articles = articles.filter((a: any) => (result.data?.article_ids??[]).includes(a.pubmed_id))

		articles.forEach((article:any) => {
			article.topArticleIndex = ((result.data??{})?.article_ids??[]).findIndex((id:any) => +id === +article.pubmed_id)
		});

		articles = _.orderBy(articles, ['topArticleIndex'], ['asc'])		
		}
		
		catch(e){
		console.log('top-articles error');
		console.log(e);
		}		

		return articles
}

function calculateOverallScore(treatments: any){
	for(const treatmentName in treatments){
		const treatment = treatments[treatmentName]

		treatment.overallScore = (0.6*treatment.numberOfArticlesScore) + (0.2*treatment.qualityScore) + (0.2* treatment.preconditionsSimilarityScore)
	}
}

function calculatePreconditionsSimilarityScore(treatments: any, preconditions: string[], symptom: string){
	if(!preconditions?.length){
		for(const treatmentName in treatments){
			const treatment = treatments[treatmentName]
	
			treatment.preconditionsSimilarityScore = 0
		}
	}

	let max = null
	let min = null

	for(const treatmentName in treatments){
		const treatment = treatments[treatmentName]
		
		let sum = 0
	
		treatment.articles = (treatment.articles??[]).map((article: any) => {
			const articleTreatments = (article?.gpt?.symptoms??{})[symptom]??[]

			const articleTreatment = articleTreatments.find((t: any) => t.treatment === treatmentName) || {}

			article.preconditionsSimilarity = _.intersection(preconditions, articleTreatment?.preconditions??[]).length

			sum += article.preconditionsSimilarity

			return article
		})

		if(sum && treatment.articles.length){
			treatment.preconditionsSimilarity = sum / treatment.articles.length

			if(max === null){
				max = treatment.preconditionsSimilarity
			}
			if(min === null){
				min = treatment.preconditionsSimilarity
			}

			if(treatment.preconditionsSimilarity > max){
				max = treatment.preconditionsSimilarity
			}

			if(treatment.preconditionsSimilarity < min){
				min = treatment.preconditionsSimilarity
			}
		}
		else{
			treatment.preconditionsSimilarity = 0
		}
	}


	for(const treatmentName in treatments){
		const treatment = treatments[treatmentName]
		
		if((treatment.preconditionsSimilarity != null) && (max != null) && (min != null) && (max !== min) && (max > min)){
			treatment.preconditionsSimilarityScore = ((treatment.preconditionsSimilarity - min) / (max - min))*100
		}
		else{
			treatment.preconditionsSimilarityScore = 0
		}
	}
}

function calculateQualityScore(treatments: any){
	let max = null
	let min = null

	for(const treatmentName in treatments){
		const treatment = treatments[treatmentName]
		
		let sum = 0
	
		treatment.articles = (treatment.articles??[]).map((article: any) => {
			article.qualityScore = 0

			if(article?.study_type === 'QUALITATIVE'){
				article.qualityScore = 1
			}
			if(article?.study_type === 'CASE_CONTROL'){
				article.qualityScore = 1.5
			}
			if(article?.study_type === 'COHORT'){
				article.qualityScore = 2
			}
			if(article?.study_type === 'RCT'){
				article.qualityScore = 3
			}

			sum += article.qualityScore

			return article
		})

		if(!treatment.articles?.length){
			treatment.qualityArticleAverage = 0
		}
		else{
			treatment.qualityArticleAverage = sum / (treatment.articles?.length)
		}

		if(max == null){
			max = treatment.qualityArticleAverage
		}

		if(min == null){
			min = treatment.qualityArticleAverage
		}

		if(treatment.qualityArticleAverage > max){
			max = treatment.qualityArticleAverage
		}

		if(treatment.qualityArticleAverage < min){
			min = treatment.qualityArticleAverage
		}
	}

	for(const treatmentName in treatments){
		const treatment = treatments[treatmentName]

		if((treatment.qualityArticleAverage != null) && (max != null) && (min != null) && (max !== min) && (max > min)){
			treatment.qualityScore = ((treatment.qualityArticleAverage - min) / (max - min))*100
		}
		else{
			treatment.qualityScore = 0
		}
	}
}

function calculateNumberOfArticlesScore(treatments: any){
	let max = null
	let min = null

	for(const treatmentName in treatments){
		const treatment = treatments[treatmentName]
		treatment.numberOfArticles = (treatment?.articles??[]).length

		if(max == null){
			max = treatment.numberOfArticles
		}

		if(min == null){
			min = treatment.numberOfArticles
		}

		if(treatment.numberOfArticles > max){
			max = treatment.numberOfArticles
		}

		if(treatment.numberOfArticles < min){
			min = treatment.numberOfArticles
		}
	}

	for(const treatmentName in treatments){
		const treatment = treatments[treatmentName]

		
		if((treatment.numberOfArticles != null) && (max != null) && (min != null) && (max !== min) && (max > min)){
			treatment.numberOfArticlesScore = ((treatment.numberOfArticles - min) / (max - min))*100
		}
		else{
			treatment.numberOfArticlesScore = 0
		}
		
	}
}

function getTreatments(articles: any[], symptom: string){
	const treatments: any = {}

	articles.forEach((article: any) => {
		const articleTreatments = (article?.gpt?.symptoms||{})[symptom] || []

		articleTreatments.forEach((treatment: any) => {
			if(!treatments[treatment.treatment]){
				treatments[treatment.treatment] = {
					treatmentName: treatment.treatment,
					articles: []
				}
			}

			treatments[treatment.treatment].articles.push(article)
		})
	})

	return treatments
}

async function findArticles(age: number, gender: string, symptom: string){
	let articles = ((await MedicineArticlesProcessed.findAll({
		raw: true,			
		where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('symptoms')), 'LIKE', '%' + symptom + '%'),
	}))) || []

	//this might be not necessary
	articles = articles.filter((a: any) => (a?.gpt?.symptoms||{})[symptom]?.length)

	articles = articles.filter((a: any) => (a.gender === null) || (a.gender === gender))

	articles = articles.filter((a: any) => ((a.min_age_group_range === null) && (a.max_age_group_range === null)) || ((+a.min_age_group_range <= +age) && (+a.max_age_group_range >= +age)))

	return articles.filter((article: any) => ((article?.title??'').match(/\srats\s/gi)??[]).length === 0)	
}

const alex = async (req: Request, res: Response) => {
	try {
		const output:any = {}

		console.log("analyzeSymptomsAndTreatments");

	const symptoms = (await SymptomMaster.findAll({raw: true})).map((s:any) => ({symptom_id: +s.symptom_id, symptom: s.symptom_name, food: [], vitamin:[], lifestyle: [], herb: []}))

	console.log("TOTAL SYMPTOMS: ", symptoms.length);
	
	const treatmentsMasterName = (await TreatmentMaster.findAll({raw: true})).reduce((acc:any, t:any) => {
		acc[t.treatment_name] = t.treatment_type

		if(t?.treatment_synonyms?.length){
			for(const synonym of (t.treatment_synonyms??'').split(',')){
				acc[synonym.trim()] = t.treatment_type
			}
		}
		return acc
	}, {})

	const treatmentsMasterId = (await TreatmentMaster.findAll({raw: true})).reduce((acc:any, t:any) => {
		acc[t.treatment_id] = t.treatment_type

		return acc
	}, {})

	 const symptomTreatment = await SymptomTreatmentsPdf.findAll({raw: true})

	for(const st of symptomTreatment){
		const symptom = symptoms.find((s:any) => +s.symptom_id === +st.symptom_id)

		for(const treatmentId of (st.treatments_ids??'').split(';').map((t:any) => t.trim()).filter((t:any) => t.length > 0).map((t:any) => parseInt(t))){
			const type = treatmentsMasterId[treatmentId]

			if(type){
				if(symptom[type]){
					symptom[type].push(treatmentId)
				}
				else{
					console.log("NOT FOUND A: ", treatmentId, type, st.symptom_id, st.symptom_name);				
				}
			}
			else{
				console.log("NOT FOUND B: ", treatmentId, type, st.symptom_id, st.symptom_name);				
			}
		}

	}
	

	// console.log(symptoms);
	

	const articles = await MedicineArticlesProcessed.findAll({raw: true, where: {is_accepted: true}})

	const notFoundTreatments:any = {}
	const notFoundSymptoms:any = {}

	for (const article of articles) {
		for(const symptom in (article?.gpt?.symptoms??{})){
			for(const treatment of (article?.gpt?.symptoms[symptom]??[])){
				if(treatment?.mainSymptomTreatment === true){
					const type = treatmentsMasterName[treatment?.treatment] 
					if(type){
						const s = symptoms.find((s:any) => s.symptom === symptom)

						if(!s){
							notFoundSymptoms[symptom] = true							
						}
						else{							
							s[type].push(treatmentsMasterId[treatment?.treatment])
						}
					}
					else{
						notFoundTreatments[treatment?.treatment] = true
					}
				}
			}

		}
	}

	console.log("NOT FOUND TREATMENTS: ", Object.keys(notFoundTreatments).join(', '));

	output.notFoundTreatments = Object.keys(notFoundTreatments)

	for(const symptom of symptoms){
		symptom.food = [...new Set(symptom.food)].length
		symptom.vitamin = [...new Set(symptom.vitamin)].length
		symptom.lifestyle = [...new Set(symptom.lifestyle)].length
		symptom.herb = [...new Set(symptom.herb)].length
	}

	//console.log(Object.keys(notFoundTreatments));
	//console.log(Object.keys(notFoundTreatments)?.length);

	console.log('SYMPTOMS NAMES');	
	console.log(symptoms.filter((s:any) => (s.food <= 0) && (s.vitamin <= 0) && (s.lifestyle <= 0) && (s.herb <= 0)).map((s:any) => s.symptom).join(','));

	output.symptomsNames = symptoms.filter((s:any) => (s.food <= 0) && (s.vitamin <= 0) && (s.lifestyle <= 0) && (s.herb <= 0)).map((s:any) => s.symptom)

	console.log('SYMPTOMS IDS');
	console.log(symptoms.filter((s:any) => (s.food <= 0) && (s.vitamin <= 0) && (s.lifestyle <= 0) && (s.herb <= 0)).map((s:any) => s.symptom_id).join(','));

	output.symptomsIds = symptoms.filter((s:any) => (s.food <= 0) && (s.vitamin <= 0) && (s.lifestyle <= 0) && (s.herb <= 0)).map((s:any) => s.symptom_id)

	console.log('SYMPTOMS COUNT');
	console.log(symptoms.filter((s:any) => (s.food <= 0) && (s.vitamin <= 0) && (s.lifestyle <= 0) && (s.herb <= 0))?.length);
	
		

		return res.send(output)
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
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

async function isQualityArticle(all_text: string, pubmedId: number){
	if (pubmedId && isQualityArticleManualApproved(pubmedId)) {
		return true
	  }

	  
	try{
	  const result = await axios.post('https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/data-models/is-quality', {all_text})
  
	  if((result.data?.is_quality !== undefined) && (result.data?.is_quality !== null)){
		return result.data?.is_quality === true
	  }
	}
	catch(e){
	  console.log('isQualityArticle error:');
	  console.log(e);
	}
  
	return true
  }


const getAngularJsScripts = async (req: Request, res: Response) => {
	try {
		let env = config.ENV

		if(env === 'local'){
			env = 'dev'
		}

		const urlBase = `https://web-${env}.meettulip.com/`

		const html = ((await axios.get(urlBase))?.data??'')

		const runtime = urlBase+((((html.match(/src\=\"runtime\..*?\.js/g)??[])[0])??'').replace('src="', '')??'')
		const polyfills = urlBase+(((html.match(/src\=\"polyfills\..*?\.js/g)??[])[0]).replace('src="', '')??'')
		const scripts = urlBase+(((html.match(/src\=\"scripts\..*?\.js/g)??[])[0]).replace('src="', '')??'')
		const main = urlBase+(((html.match(/src\=\"main\..*?\.js/g)??[])[0]).replace('src="', '')??'')

		const stylesFile = urlBase + ((((html.match(/href\=\"styles\.\w+?\.css/g)||[])[0]??'').replace(/\'/g,'').replace(/\"/g,'').replace('href=', ''))??'')

		const style = ((await axios.get(stylesFile))?.data??'')

		const fonts = (style.match(/url\(.+?\.\w+?\.woff(2?)/g)||[]).map((f:any) => urlBase+(f?.replace('url(', '')??''))
		
		return res.send({
			js: {
				runtime,
				polyfills,
				scripts,
				main
			},
			fonts
		})
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

export { getAllSmartInsights, getSmartInsightLandingPage, getFoodsSupplementsFromArticles, getAllArticles, getSmartRecommendation, getSmartRecommendation2, getSmartRecommendation3, getSmartRecommendation4, alex, getAngularJsScripts, getAllSymptomsAndTreatments, getAllArticlesOwn, getSmartRecommendation5 }
