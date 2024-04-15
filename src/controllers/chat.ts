import { Request, Response } from "express"
import axios from "axios"
import { Sequelize, Op } from 'sequelize'
import UserAnswers from "../models/useranswers"
import Questions from "../models/questions"
import Medications from "../models/medications"
import LeadModel from "../models/lead"
import { UserModel, UserProfileModel } from "../models"
import transporter from "../services/mail"
import { getSmartInteractionSentence } from "../services/GPT-3"
import Allergies from "../models/allergies"

export const getSingleUser = async (req: Request, res: Response) => {
	const id = req.body.payload.user_id
	const id_group = req.params.group_id
	const user_answers = await UserAnswers.findOne({
		where: {
			user_id: id,
			group_id: id_group,
		},
		order: [["time", "DESC"]],
	})

	if (user_answers) {
		res.json(user_answers)
	} else {
		res.status(204).json({
			msg: `Answers for user with id ${id} not found`,
		})
	}
}

export const getQuestion = async (req: Request, res: Response) => {
	const id_question = req.query.id_question
	const group_id = req.query.group_id

	const question = await Questions.findOne({
		where: {
			id_question: id_question,
			group_id: group_id,
		},
	})

	if (question) {
		res.json(question)
	} else {
		res.status(204).json({
			msg: `Question not found`,
		})
	}
}

export const getChatBot = async (req: Request, res: Response) => {
	await axios({
		method: "post",
		url: "http://chatbot.meettulip.com:5005/webhooks/rest/webhook",
		data: {
			message: req.body.message,
		},
	})
		.then((data: any) => {
			res.json(data.data)
		})
		.catch((error: any) => {
			res.status(500).json({
				msg: `${error}. Contact Admin`,
			})
		})
}

export const getAllQuestions = async (req: Request, res: Response) => {
	const question = await Questions.findAll({
		where: {
			group_id: [101, 102, 103, 104, 105]
		},
		order: [["id"]],
	})

	if (question) {
		res.json(question)
	} else {
		res.status(204).json({
			msg: `Questions not found`,
		})
	}
}

export const postAnswers = async (req: Request, res: Response) => {
	const id_user = req.body.payload.user_id
	const lead_id = req.body.payload.lead_id
	const group_id = req.query.group_id
	const data = JSON.parse(req.body.data??req.body.answers)
	const bubble_counters = JSON.parse(req.body.bubble_counters??null)

	if(!data){
		return res.status(400).json({
			msg: "Data or answers is required"
		})
	}

	const insert = {
		user_id: id_user,
		lead_id: lead_id,
		group_id: group_id,
		data: data,
		bubble_counters
	}

	const answers = new UserAnswers(insert)
	await answers.save()

	await sendEmailUserNotReadyToGetInsights(id_user, lead_id, group_id?.toString(), data)
	res.send()
}

async function sendEmailUserNotReadyToGetInsights(userId: string | number | undefined | null, leadId: string | number | undefined | null, groupId: string|number|undefined|null, data: any){
	if(!groupId || !(+groupId) || !data || !Array.isArray(data)){
		return
	}

	const questions = await Questions.findAll({raw: true,  where: {
      [Op.and]: [
        { group_id: groupId },
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('question')), 'LIKE', '%are%you%ready%get%insight%'),
      ],
    },})

	if(questions && questions.length){
		const question = questions[0]
		const choiceNo = (question?.options?.choices??[]).find((c: any) => (c.name??'').toUpperCase() === 'NO')

		if(!choiceNo){
			return 
		}

		const answers = data.reduce((acc: any, item: any) => {
			acc[item.question_id] = item.values
			return acc
		}, {})

		if(answers[question.id_question] !== choiceNo.value){
			return
		}

		const nextQuestion = +(choiceNo?.next)??0

		let email

		if(nextQuestion && answers[nextQuestion] && (answers[nextQuestion]??'').toLowerCase().trim().match(
		  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		)){
			email = answers[nextQuestion].trim()
		}

		if(!email && leadId && +leadId){
			const lead = await LeadModel.findOne({raw: true, where: {lead_id: +leadId}})

			if(lead && lead.email){
				email = lead.email
			}			
		}

		if(!email && userId && +userId){
			const user = await UserModel.findOne({raw: true, where: {user_id: +userId}})

			if(user && user.email){
				email = user.email
			}			
		}

		if(email){
			const mailOptions = {
				from: "noreply@meettulip.com",
				to: email,
				text: "From Tulip",
				subject: "Tulip Insights",
				html: "<h3>You can come back anytime to get your personalized insights and recommendation plan. </h3>", // html body
			}
		
			await transporter.sendMail(mailOptions)
		}
	}
}

export const getSuggestedMedications = async (req: Request, res: Response) => {
	const text = req.body.text

	const medications = await Medications.findAll({
		raw: true,
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})
	try {
		const results = medications.filter(
			(value: any) =>
				value.brand_name?.toLowerCase().includes(text.toLowerCase()) ||
				value.generic_name?.toLowerCase().includes(text.toLowerCase())
		)
		res.json({
			results,
		})
	} catch(error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}
}

export const getMedicationsByIds = async (req: Request, res: Response) => {
	const ids = req.body.ids
	const medications = await Medications.findAll({
		raw: true,
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})
	const medicationsList = ids.split(",")
	let result: any = []
	medicationsList.forEach((val: any) => {
		const listed = medications.filter((val2: any) =>
			val2.id == val
		)
		result.push(...listed)
		
	})
	res.json(result)
}

export const getAllergiesByIds = async (req: Request, res: Response) => {
	const ids = req.body.ids
	const allergies = await Allergies.findAll({
		raw: true,
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})
	const allergiesList = ids.split(",")
	let result: any = []
	allergiesList.forEach((val: any) => {
		const listed = allergies.filter((val2: any) =>
			val2.allergy_id == val
		)
		result.push(...listed)
		
	})
	res.json(result)
}

export const resetId = async (req: Request, res: Response) => {

	const id_user = req.body.payload.user_id

	await UserAnswers.destroy({
		where: {
			user_id: id_user, 
		},
	  }).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})

	res.json({message: "User reset success"})
}

export const getSmartInteraction = async (req: Request, res: Response) => {
  try {
    const userId = req.body.payload.user_id
    const leadId = req.body.payload.lead_id
    const groupId = +(req.body.group_id ?? '0')
    const key = req.body.key ?? null
    const answers = req.body.answers ?? []

    let userName = ''

    if (userId) {
      const userProfile = await UserProfileModel.findOne({ raw: true, where: { user_id: userId } })

      if (!userProfile) {
        throw new Error('User profile not found')
      }

      userName = userProfile.first_name ?? '' + ' ' + userProfile.last_name ?? ''
    }

    if (leadId) {
      const lead = await LeadModel.findOne({ raw: true, where: { lead_id: leadId } })

      if (!lead) {
        throw new Error('Lead not found')
      }

      userName = lead.firstname
    }

    try {
      const sentence = await getSmartInteractionSentence(userName, groupId, key, answers)

      return res.send({ sentence })
    } catch (error: any) {
      console.log(error)

      return res.status(400).json({
        message: error.message,
      })
    }
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const getSuggestedAllergies = async (req: Request, res: Response) => {
	const text = req.body.text
	const food: boolean = req.body.food
	let where: any
	if (food) {
		where = {
			allergy_type: 'Food'
		}
	} else {
		where = {
			allergy_type: 'Airborne'
		}
	}

	const allergies = await Allergies.findAll({
		raw: true,
		where: where
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})
	try {
		const results = allergies.filter(
			(value: any) =>
				value.name?.toLowerCase().includes(text.toLowerCase())
		)
		res.json({
			results,
		})
	} catch(error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}
}