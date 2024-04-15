import { Request, Response } from "express"
import QuestionGrammar from "../../models/questiongrammar"
import QuestionRemedies from "../../models/questionremedies"
import Remedies from "../../models/remedies"
import RemediesExceptions from "../../models/remediesexceptions"
import DynamicContent from "../../models/dynamic_content"
import UserAnswers from "../../models/useranswers"
import Presets from "../../models/presets"
import { getAllergies } from "../../utils/getAllergies"
import { getMedications } from "../../utils/getMedications"
import { getContra } from "../contra-defi/contraindications"
import { getDeficiency } from "../contra-defi/deficiency"
import { getUserAnswers, getBubbleCounters } from "../../utils/getUserAnswers"
import { getTaggedQuestions } from "../../utils/getTaggedQuestions"
import { getDashboardReference } from "../../utils/getDashboardReference"
import { getHealthScore } from "../dashboard/getHealthScore"
import { getRootCauses } from "../dashboard/getRootCauses"
import { getScales } from "../dashboard/getScales"
import { getSubOptimal } from "../dashboard/getSubOptimal"
import { getUserConstitution } from "../dashboard/getUserConstitution"
import { getConstitutions } from "../../utils/getConstitutions"
import AWS from 'aws-sdk'
import { ACL, SpaceName } from "../../types/interface"
import UserOrdersModel from "../../models/user/userOrders"
import { StripeModel } from "../../models"
import { getUserHydration } from "./getUserHydration"
import { getPresets } from "../../utils/getPresets"
import { getUserNutrition } from "./getUserNutrition"
import { getRemedyMadlibs } from "../../utils/getRemedyMadlibs"
import config from "../../config"
import { getCovidPresets } from "./getCovidPresets"
import { removeDuplicates } from "../../utils"
import { getTCMRootCause } from "./getTCMRootCause"
import { getNutritions } from "../../utils/getNutritions"
import { getNutritionMadlibs } from "../../utils/getNutritionMadlibs"
import { getMainDashboard } from "../dashboard"
import { getRemedyGPTInputs } from "./getRemedyGPTInputs"

const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? '')

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET,
})


export const getRemedies = async (req: Request, res: Response) => {
	const id = req.body.payload.user_id
	const id_group = req.body.group_id
	const user_answers = await UserAnswers.findOne({
		raw: true,
		attributes: ["data"],
		where: {
			user_id: id,
			group_id: id_group,
		},
		order: [["time", "DESC"]],
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})
	try {
		if (user_answers) {
			await checkRemedies(req, res, user_answers)
		} else {
			res.status(204).json({
				message: `Answers for user ${id} not found`,
			})
		}
	}
	catch(e) {
		console.log(e);
		res.status(500).json({
			message: `Internal server error`,
		});
	}
}

export const checkRemedies = async (req: Request, res: Response, user_answers: any) => {
	const id_group = req.body.group_id
	const question_remedies = await QuestionRemedies.findAll({
		raw: true,
		where: {
			id_group: id_group
		},
	}).catch((error: any) => {
		res.status(500).json({
			message: `${error}. Contact Admin`,
		})
	})
	if (question_remedies[0]) {
		await countRemedies(req, res, question_remedies, user_answers)
	} else {
		res.status(404).json({ 
			message: `Database error (Question Remedies). Check group_id or Contact Admin`,
		})
	}
}

export const countRemedies = async (req: Request, res: Response, question_remedies: any, user_answers: any) => {
	const data = user_answers.data
	const filterMain: boolean = req.body.filter
	const id_group = req.body.group_id
	
	let excluded: string[] = []
	let count = await data.reduce(
		(acc: any, el: any) => {
			const filter = question_remedies.filter(
				(val: any) => val.id_question == el.question_id && el.values.includes(val.answer_value)
			)
			if (filter.length > 0) {
				filter.forEach((el2: any) => {
					if (filter.exception && filter.exception.toString().includes("Dont") && filterMain) {
						const excep = filter.exception.split("&&")
						const supexcep = excep[1].split(",")
						supexcep.forEach((val: any) => {
							excluded.push(val)
						})
					}
					if(el2.remedy_type != '') {
						acc[el2.remedy_type].push([el2.remedy_id,el2.weight])
					}
				})
			}
			return acc
		},
		{ remedy: [], nutrition: [], hydration: [], lifestyle: [], preset: [] }
	)
	if(id_group != 105) {
		const presets = await getPresets(id_group)
		if(presets.length == 0) {
			res.json({msg: "Presets tables not found. Contact Admin"})
			return
		}
		const dashboard_reference = await getDashboardReference(id_group)
		if (dashboard_reference.length == 0) {
			res.json({ msg: 'Dashboard Reference not found. Contact Admin' })
			return
		}
		if(id_group != 104) {
			const constitutions = await getConstitutions(id_group)
			if(constitutions.length == 0) {
				res.json({msg: "Constitutions tables not found. Contact Admin"})
				return
			}
			const hydration = await getUserHydration(user_answers,constitutions,presets)
			count['hydration'] = hydration
		} else {
			const TCMRootCause = await getTCMRootCause(user_answers, dashboard_reference)
			const finalPreset = presets.filter((item: any) => item.preset_id == TCMRootCause[0])
			finalPreset.forEach((item: any) => {
				if(item.remedy_type == 'hydration') {
					count[item.remedy_type].push([item.remedy_id,0])
				}
			})
		}
		const nutritions = await getNutritions(id_group)
		if (nutritions.length == 0) {
			res.json({ msg: 'Nutritions Table not found. Contact Admin' })
			return
		}
		const nutrition = await getUserNutrition(user_answers, nutritions, dashboard_reference)
		count['nutrition'] = nutrition
		if(count['preset'].length > 0){
			count = await unpackPresets(req, res, count, presets)
		}
		if (filterMain) {
			if (excluded.length > 0) {
				excluded.forEach((val: any) => {
					const sup = val.split(".")
					count[sup[0]] = count[sup[0]].filter((item: any) => sup[1] != item[0])
				})
			}
			await checkExceptions(req, res, count, user_answers, dashboard_reference)
		} else {
			await orderObject(req, res, count, user_answers, dashboard_reference)
		}
	} else {
		await checkExceptions(req, res, count, user_answers)
	}
}

export const unpackPresets = async (req: Request, res: Response,count: any, presets: any) => {
	try {
		const id_group = req.body.group_id
		if (presets.length > 0) {
			if(id_group != 104 && id_group != 105) {
				let finalPreset = 0
				if(count['preset'].length > 1) {
					finalPreset = Math.floor(Math.random() * count['preset'].length)
				}
				presets = presets.filter((item: any) => item.preset_id == count['preset'][finalPreset][0])
			} else if (id_group != 105){
				const finalPresets = await getCovidPresets(count['preset'])
				presets = presets.filter((item: any) => finalPresets.includes(item.preset_id))
			}
			if(id_group != 104 && id_group != 105) {
				presets.forEach((item: any) => {
					count[item.remedy_type].push([item.remedy_id,0])
				})
			} else {
				let countRemedy: any = {}
				let countLifestyle : any = {}
				const mainPresets = removeDuplicates(presets.map((item: any) => item.preset_id))
				if(mainPresets.length == 3) {
					countRemedy[mainPresets[0]] = {max: 2, actual: 0}
					countRemedy[mainPresets[1]] = {max: 2, actual: 0}
					countRemedy[mainPresets[2]] = {max: 2, actual: 0}
					countLifestyle[mainPresets[0]] = {max: 2, actual: 0}
					countLifestyle[mainPresets[1]] = {max: 2, actual: 0}
					countLifestyle[mainPresets[2]] = {max: 2, actual: 0}
				} else if(mainPresets.length == 2) {
					countRemedy[mainPresets[0]] = {max: 3, actual: 0}
					countRemedy[mainPresets[1]] = {max: 3, actual: 0}
					countLifestyle[mainPresets[0]] = {max: 3, actual: 0}
					countLifestyle[mainPresets[1]] = {max: 3, actual: 0}
				} else if(mainPresets.length == 1){
					countRemedy[mainPresets[0]] = {max: 6, actual: 0}
					countLifestyle[mainPresets[0]] = {max: 6, actual: 0}
				}
				presets.forEach((item: any) => {
					if(item.remedy_type == 'remedy') {
						if(countRemedy[item.preset_id]['actual'] < countRemedy[item.preset_id]['max']){
							count[item.remedy_type].push([item.remedy_id,0])
							countRemedy[item.preset_id]['actual']++
						}
					} else if(item.remedy_type == 'lifestyle') {
						if(countLifestyle[item.preset_id]['actual'] < countLifestyle[item.preset_id]['max']){
							count[item.remedy_type].push([item.remedy_id,0])
							countLifestyle[item.preset_id]['actual']++
						}
					}
				})
			}
			return count
		} else {
			console.log(`Database error (Presets). Check Contact Admin`)
			return count
		}
	} catch(error) {
		return count
	}
}

export const checkExceptions = async (req: Request, res: Response, count: any, user_answers: any, dashboard_reference: any = []) => {
	const id_group = req.body.group_id
	
	const remedies_exceptions = await RemediesExceptions.findAll({
		raw: true,
		where: {
			id_group: id_group,
		},
	}).catch((error: any) => {
		res.status(500).json({
			message: `${error}. Contact Admin`,
		})
	})
	// if (remedies_exceptions[0]) {
	// 	filterExceptions(req, res, count, remedies_exceptions, user_answers)
	// } else {
	// 	res.status(404).json({
	// 		msg: `Database error (exceptions). Check group_id or Contact Admin`,
	// 	})
	// }
	filterExceptions(req, res, count, remedies_exceptions, user_answers, dashboard_reference)
}

export const filterExceptions = async (
	req: Request,
	res: Response,
	count: any,
	remedies_exceptions: any,
	user_answers: any,
	dashboard_reference: any,
) => {
	try {
		if (remedies_exceptions.length > 0) {
			remedies_exceptions.forEach((item: any) => {
				let options = item.exception_rule.replace(/ /g,"").split(",")
				if (item.exception_type == "Choose One Random") {
					options = options.filter((val: any) => {
						const sup = val.split(".")
						let i = 0
						if(sup[0] != 'nutrition') {
							count[sup[0]].forEach((val2: any) => {
								if(val2[0] == sup[1]) {
									i++
								}
							})
						}
						return i != 0
					})
					if (options.length > 1) {
						options.splice(Math.floor(Math.random() * options.length), 1)
						options.forEach((val: String) => {
							const sup = val.split(".")
							count[sup[0]] = count[sup[0]].filter((item: any ) => item[0] != sup[1])
						})
					}
				}
			})
		}
		let medications:any[] = [], allergies:any[] = []
		const id = req.body.payload.user_id
		const promise1 = new Promise((resolve, reject) => {
			resolve(getAllergies(id))
		})
		const promise2 = new Promise((resolve, reject) => {
			resolve(getMedications(id))
		})

		await Promise.all([promise1, promise2]).then((values: any) => {
			allergies = values[0]
			medications = values[1]
		})

		if(medications.length > 0 || allergies.length > 0) {
			const elements = ['remedy','hydration']
			const id_group = req.body.group_id
			const remedies = await Remedies.findAll({
				raw: true,
				where: {
					id_group: id_group,
					remedy_type: elements,
				},
			})

			if (medications.length > 0) {
				elements.forEach((element: any) => {
					let avoid: any[] = []
					medications.forEach((val: any) => {
						const forbidden = remedies.filter((val2: any) => {
							const medication_interactions = val2.options?.medication_interaction_ids?.split(",")
							return medication_interactions?.includes(val) && val2.remedy_type == element
						})
						if(forbidden.length > 0) {
							avoid = avoid.concat(forbidden.map((item: any) => item.remedy_id))
						}
					})
					if(avoid.length > 0) {
						count[element] = count[element].filter((supplement: any) => !avoid.includes(supplement[0]))
					}
				})
			}
	
			if (allergies.length > 0) {
				elements.forEach((element: any) => {
					let avoid: any[] = []
					allergies.forEach((val: any) => {
						const forbidden = remedies.filter((val2: any) => {
							const allergy_id = val2.allergy_id?.split(",")
							return allergy_id?.includes(val) && val2.remedy_type == element
						})
						if(forbidden.length > 0) {
							avoid = avoid.concat(forbidden.map((item: any) => item.remedy_id))
						}
					})
					if(avoid.length > 0) {
						count[element] = count[element].filter((supplement: any) => !avoid.includes(supplement[0]))
					}
				})
			}
		}
		await orderObject(req, res, count, user_answers, dashboard_reference)
	} catch (error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}
}

export const orderObject = async (req: Request, res: Response, object: any, user_answers: any, dashboard_reference: any = []) => {
	try {
		const id_group = req.body.group_id
		const filterMain: boolean = req.body.filter
		let text: string
		const listRemedy = object['remedy'].map((item: any) => item[0])
		switch(id_group) { 
			case 101: { 
				text = 'sleep' 
				if(!listRemedy.includes(215)) {
					object['remedy'].push([215,0])
				}
				if(!listRemedy.includes(238)) {
					object['remedy'].push([238,0])
				}
			break
			} 
			case 102: { 
				text = 'fatigue' 
				if(!listRemedy.includes(70)) {
					object['remedy'].push([70,0])
				}
				if(!listRemedy.includes(53)) {
					object['remedy'].push([53,0])
				}
			break
			} 
			case 103: { 
				text = 'bs' 
				if(!listRemedy.includes(114)) {
					object['remedy'].push([114,0])
				}
				if(!listRemedy.includes(97)) {
					object['remedy'].push([97,0])
				}
			break
			} 
			case 104: { 
				text = 'lc' 
				if(!listRemedy.includes(331)) {
					object['remedy'].push([331,0])
				}
				if(!listRemedy.includes(332)) {
					object['remedy'].push([332,0])
				}
				if(!listRemedy.includes(333)) {
					object['remedy'].push([333,0])
				}
				if(!listRemedy.includes(334)) {
					object['remedy'].push([334,0])
				}
			break
			} 
		}
		const remedies = await Remedies.findAll({
			raw: true,
			where: {
				id_group: id_group,
			},
		}).catch((error: any) => {
			res.status(500).json({
				message: `${error}. Contact Admin`,
			})
		})
		let obj: any = { remedy: [], nutrition: [], hydration: [], lifestyle: [] }
		Object.keys(object).forEach((key: any) => {
			let tmp: any[] = []
			if(key != 'nutrition') {
				object[key] = object[key].filter(function (v: any) {
					if (tmp.indexOf(v.toString()) < 0) {
						tmp.push(v.toString());
						return v;
					}
				})
				object[key].forEach((item: any) => {
					if(key != 'preset') {
						const remedy = remedies.filter((val: any) => val.remedy_id == item[0] && val.remedy_type == key)
						if(remedy.length > 0) {
							let bulletpoints: any
							if(key == 'lifestyle'){
								bulletpoints = remedy[0].options?.bullet_points?.split(";")??[]
							}
							obj[key].push({
								id: item[0],
								name: remedy[0].name??'',
								brand: remedy[0].brand??'',
								link_coupon_code: remedy[0].link_coupon_code??'',
								options: remedy[0].options??'',
								weight: item[1],
								imageUrl: remedy[0].image_url??null,
								bulletpoints,
								html: '<h1>'+(remedy[0].name??'')+'</h1>'+
									'<p>'+(remedy[0].options.descriptions??'').replace(/\n/g,"<br />")+'</p>'+
									'<p>'+(remedy[0].link_coupon_code??'').replace(/\n/g," ")+'</p>'+
									(remedy[0].image_url?`<img src="${remedy[0].image_url}" >`:'')					
							})
						}
					}
				})
			}
			if(key != 'preset' && key != 'nutrition') {
				obj[key].sort((a: any, b: any) => {
					if (a.weight < b.weight) {
						return 1
					}
					if (a.weight > b.weight) {
						return -1 
					}
					return 0
				})
			}
		})
		obj['nutrition'] = object['nutrition']
		if(filterMain) { 
			filterObject(req, res, obj, user_answers, dashboard_reference)
		} else {
			res.json(obj) 
		}
	} catch (error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}
}

export const filterObject = async(req: Request, res: Response, object: any, user_answers: any, dashboard_reference: any) => {

	const id_group = req.body.group_id

	let obj: any = { 
		remedy: [], nutrition: [], hydration: [], lifestyle: []
	}

	if(id_group != 104 && id_group != 105) {

		let N = 0, NN = 0, H = 0, HH = 0
		
		object['remedy'].forEach((val: any) => {
			if(val.options.herb_nutrient == 'N') {
				N++
			} else if(val.options.herb_nutrient == 'NN') {
				NN++
			} else if(val.options.herb_nutrient == 'H') {
				H++
			} else if(val.options.herb_nutrient == 'HH') {
				HH++
			}
		})
		let maxN = 1, maxNN = 1, maxH = 1, maxHH = 1

		if(N == 0) {
			maxNN = 2
			maxN = 0
		} else if(NN == 0) {
			maxNN = 0
			maxN = 2
		}

		if(H == 0) {
			maxHH = 2
			maxH = 0
		} else if(HH == 0) { 
			maxHH = 0
			maxH = 2
		}

		let count: any = { 
			remedy: {N: {max: maxN, actual: 0}, NN: {max: maxNN, actual: 0}, H: {max: maxH, actual: 0}, HH: {max: maxHH, actual: 0}, A: {max: 0, actual: 0}},  
			hydration: {max: 4, actual: 0}, 
			lifestyle: {max: 3, actual: 0}	
		}
		Object.keys(object).forEach((key: any) => {
			if(key != 'nutrition') {
				object[key].forEach((val: any) => {
					if(key == 'remedy') {
						if(val.options.herb_nutrient && val.options.herb_nutrient != '0') {
							if(count[key][val.options.herb_nutrient]["max"]
							>
							count[key][val.options.herb_nutrient]["actual"]
							) {
								obj[key].push(val)
								count[key][val.options.herb_nutrient]["actual"]++
							}
						}
					} else {
						if(count[key]["max"] > count[key]["actual"]) {
							obj[key].push(val)
							count[key]["actual"]++
						}
					}
				})
			}
		})
		
	} else {
		// obj['remedy'] = object['remedy'].slice(0, 4)
		obj['remedy'] = object['remedy']
		obj['hydration'] = object['hydration']
		obj['lifestyle'] = object['lifestyle']
	}
	if (id_group != 105) {
		obj['nutrition'] = object['nutrition']
	} else {
		obj['nutrition'] = object['nutrition']?.map((nutrient: any) => nutrient[0])
	}
	if(id_group != 105 && obj['remedy'].length < 4) {
		const extra = object['remedy'].filter((item: any) => [53,70,97,114,215,238,331,332,333,334].includes(item.id))
		obj['remedy'].push(extra[0])
	}
	
	const remedy_madlibs = await getRemedyMadlibs(dashboard_reference, obj['remedy'], user_answers)
	if(remedy_madlibs.length > 0) {
		obj['remedy'] = remedy_madlibs
	}
	const nutrition_madlibs = await getNutritionMadlibs(dashboard_reference, obj['nutrition'], user_answers)
	if(nutrition_madlibs?.length > 0) {
		obj['nutrition'] = nutrition_madlibs
	}
	if (id_group == 105) {
		obj['remedy'] = obj['remedy'].slice(0, 2)
		obj['nutrition'] = obj['nutrition'].slice(0, 1)
		obj['hydration'] = obj['hydration'].slice(0, 1)
		obj['lifestyle'] = obj['lifestyle'].slice(0, 1)
	}
	res.json(obj)
}

export const getStory = async (req: Request, res: Response) => {
	const id_section = req.body.section_id
	if(id_section >= 5) {
		const id = req.body.payload.user_id
		const id_group = req.body.group_id
		const user_answers = await UserAnswers.findOne({
			raw: true,
			attributes: ["data"],
			where: {
				user_id: id,
				group_id: id_group,
			},
			order: [["time", "DESC"]],
		}).catch((error: any) => {
			res.status(500).json({
				msg: `${error}. Contact Admin`,
			})
		})
		if (user_answers) {
			await checkGrammar(req, res, user_answers)
		} else {
			res.status(204).json({
				message: `Answers for user ${id} not found`,
			})
		}
	} else {
		await getText(req,res)
	}
}

export const getText = async (req: Request, res: Response) => {
	const id_group = req.body.group_id
	const id_section = req.body.section_id
	const texto = await DynamicContent.findOne({
		raw: true,
			attributes: ["content"],
			where: {
				id_group: id_group,
				id_section: id_section,
		}
	})
	res.json({text: {content: texto?.content}}) 
}

export const checkGrammar = async (req: Request, res: Response, user_answers: any) => {
	const id_group = req.body.group_id
	const question_grammar = await QuestionGrammar.findAll({
		raw: true,
		where: {
			id_group: id_group,
		},
	}).catch((error: any) => { 
		res.status(500).json({
			message: `${error}. Contact Admin`,
		})
	})
	if (question_grammar[0]) {
		await populateGrammar(req, res, user_answers, question_grammar)
	} else {
		res.status(404).json({
			message: `Database error (Question Grammar). Check group_id or Contact Admin`,
		})
	}
}

export const populateGrammar = async (req: Request, res: Response, user_answers: any, question_grammar: any) => {
	const data = user_answers.data
	const id_group = req.body.group_id
	const id_section = req.body.section_id
	const texts = question_grammar.filter((val: any) => {
		let i = 0 
		data.forEach((val2: any) => {
			if(val.id_question.toString() == val2.question_id.toString() && val2.values.toString().includes(val.answer_value.toString())) {
				i++
			}
		})
		if (i==0){
			return false
		} else {
			return true
		}
	})
	const texto = await DynamicContent.findOne({
		raw: true,
			attributes: ["content"],
			where: {
				id_group: id_group,
				id_section: id_section,
		}
	})
	res.json({
		text: texto,
		placeholders: texts
	})
}

// Without mocking req and res, we need deeper refactorings for remedies, contra, def, rci and stories.
let myMock = function(user_id:number, group_id:number, section_id:number){
	var mockReq = ({
		query:{
			group_id: group_id,
			filter: true
		},
		body:{
			payload: {
				user_id: user_id,
				filter: true
			},
			group_id: group_id,
			section_id:section_id,
			filter: true
		}
	}) as unknown as Request
	var anyCollection: any[] = [];
	var mockRes = {
		status: function(status:number){
			return {
				json: function(x:any){
				}
			}
        },json: function(x:any){
			anyCollection.push(x);
		}
	} as unknown as Response;
	return [mockReq,mockRes,anyCollection]
}

export const getAllGenerate = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id
		const group_id = +(req.query.planId ?? '0')

		if(group_id !== 105){
			const productId = (await StripeModel.findOne({ where: { group_id }, raw: true }))?.id

			if (!productId) {
				throw new Error('No product id found')
			}
			
		  const userOrder = await UserOrdersModel.findOne({raw: true, where: {user_id: user_id, product_id: productId, status: 'paid'}})
	
		  if (!userOrder) {
			return res.status(404).json({
					message: 'User has no paid order',
			})
		  }
		}
	  
	  var [mockReq, mockRes, remedies] = myMock(user_id, group_id, 0)
	  await getRemedies(mockReq as Request, mockRes as Response)
	  var [mockReq, mockRes, contra] = myMock(user_id, group_id, 0)
	  await getContra(mockReq as Request, mockRes as Response)
	  var [mockReq, mockRes, def] = myMock(user_id, group_id, 0)
	  await getDeficiency(mockReq as Request, mockRes as Response)

		const gpt = await getRemedyGPTInputs(user_id, group_id, ((remedies as any[]) ?? [])[0])
	  
  
	  // ========
	  const tags: string[] = ['age', 'height', 'weight', 'scale_energy', 'scale_stress', 'scale_mood']
	  const user_answers = await getUserAnswers(user_id, group_id)
	  if (user_answers.length == 0) {
		res.json({ msg: 'Answers for this user not found' })
		return
	  }

	  let metrics:any = {}
	  let health_score:any = {}
	  let rc_summary:any = {}
	  let suboptimal:any = {}

	  if(group_id !== 105){
		const questions = await getTaggedQuestions(tags, group_id)
		if (questions.length == 0) {
			res.json({ msg: 'Question tag not found. Contact Admin' })
			return
		}
		const dashboard_reference = await getDashboardReference(group_id)
		if (dashboard_reference.length == 0) {
			res.json({ msg: 'Dashboard Reference not found. Contact Admin' })
			return
		}

		metrics = await getScales(user_answers, questions)
		health_score = await getHealthScore(user_answers, dashboard_reference)
		rc_summary = await getRootCauses(user_answers, dashboard_reference)
		suboptimal = await getSubOptimal(user_answers, dashboard_reference)
	  }

	  const constitutions = await getConstitutions(group_id)
	  if (constitutions.length == 0) {
		res.json({ msg: 'Constitutions tables not found. Contact Admin' })
		return
	  }
	  var constitutions2 = await getUserConstitution(user_answers, constitutions)
  
	  var stories: any[] = []
	  for (var i = 1; i <= 16; i++) {
		var [mockReq, mockRes, story] = myMock(user_id, group_id, i)
		await getStory(mockReq as Request, mockRes as Response)
		stories.push(story)
	  }

	  var bubbleCounters = await getBubbleCounters(user_id, group_id);

	  var [mockReq, mockRes, dashboard] = myMock(user_id, group_id, 0)
	  await getMainDashboard(mockReq as Request, mockRes as Response)
  
	  const megapack = {
		supplement: ((remedies as any[]) ?? [])[0]?.remedy,
		hydration: ((remedies as any[]) ?? [])[0]?.hydration,
		lifestyle: ((remedies as any[]) ?? [])[0]?.lifestyle,
		nutrition: ((remedies as any[]) ?? [])[0]?.nutrition,
  
		contra: (contra as any)[0],
		deficiency: (def as any)[0],
		stories: (stories as any).map((x: any[]) => x[0]),
  
		metrics: metrics?.scales,
		health_score: health_score?.health_score,
		rc_summary: rc_summary,
		suboptimal: suboptimal?.suboptimal,
		constitutions: constitutions2.constitution,

		bubbleCounters: bubbleCounters,
		dashboard: (dashboard as any)[0],
		gpt
	  }
  
	  const uploadResult = await new Promise((resolve, reject) => {
		s3.putObject(
		  {
			Bucket: SpaceName.TulipUserData,
			Key: `user-plan-cache/${config.NODE_ENV}_${user_id}_${group_id}.json`,
			ACL: ACL.private,
			Body: Buffer.from(JSON.stringify(megapack)),
			ContentType: 'application/json',
		  },
		  (err, data: any) => {
			if (err) {
			  reject(err)
			} else {
			  resolve(true)
			}
		  }
		)
	  })
  
	  if (uploadResult) {
		return res.send(megapack)
	  }
  
	  return res.status(500).send()
	} catch (err) {
	  console.log(err)
	  return res.status(500).json({
		msg: 'INTERNAL ERROR',
	  })
	}
  }
  
  export const getAll = async (req: Request, res: Response) => {
	try {
	  const url = await s3.getSignedUrl('getObject', {
		Bucket: SpaceName.TulipUserData,
		Key: `user-plan-cache/${config.NODE_ENV}_${req.body?.payload?.user_id ?? ''}_${+(req.query?.planId ?? '0')}.json`,
	  })
  
	  return res.status(200).json({
		url,
	  })
	} catch (err) {
	  console.log(err)
	  return res.status(500).json({
		msg: 'INTERNAL ERROR',
	  })
	}
  }