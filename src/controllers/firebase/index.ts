import { Request, Response } from "express"
import { QuestionsModel, UserAnswerModel, UserProfileModel } from "../../models"

const sendMessageOnDevice = async (req: Request, res: Response) => {
	const fetchTokens = await UserProfileModel.findAll({ attributes: ["device_tokens"] })

	let tokens: string[] = []

	const data = fetchTokens.forEach((element: any) => {
		if (element.device_tokens !== null) {
			tokens.push(element.device_tokens)
		}
	})

	// const response = await sendMesage(tokens, null)
	// res.send({ message: response })
}

const sendSurveyNotification = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.user_id
		const fetchTokens = await UserProfileModel.findAll({ where: { user_id }, attributes: ["device_tokens"] })

		let tokens: string[] = []

		const data = fetchTokens.forEach((element: any) => {
			if (element.device_tokens !== null) {
				tokens.push(element.device_tokens)
			}
		})

		const user_answer = await UserAnswerModel.findOne({ where: { user_id }, attributes: ["last_question"] })

		const question = await QuestionsModel.findOne({
			where: {
				id_question: user_answer.last_question,
				group_id: 2,
			},
			raw: true,
		})

		//const response = await sendMesageToDevice(tokens, question)
		res.send({ message: "" })
	} catch (error) {
		res.status(400).send({ error })
	}
}

export { sendMessageOnDevice, sendSurveyNotification }
