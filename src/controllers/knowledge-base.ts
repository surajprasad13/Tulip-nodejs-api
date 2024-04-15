import axios from "axios"
import { Request, Response } from "express"
import config from "../config"
import KbAskHistory from "../models/kb_ask_history"
import Medications from "../models/medications"
import { getMedications } from "../utils/getMedications"

export interface RasaMessageSend {
	"sender": string,
	"message": string
}

export const RasaMessageSend = async (req: Request, res: Response) => {
	try {
		// Check if question already asked
		let baseUrl: string = config.TULIP_KNOWLEDGEBASE_URL || ""
		let sender: string = req.body.sender
		let message: string = req.body.message
		var user_id = req.body.payload.user_id;
		var past = await KbAskHistory.findOne({
			where: {
				user_id: user_id,
				question: message,
			},
			order: [["id"]],
		})
		if (past != null)
		{
			return res.status(200).json({
				answer: past.answer
			})
		}

		// Query
		const result = await axios.post(baseUrl, { sender, message })
		if (result.data == null || result.data.length == 0) {
            return res.status(200).json({ answer: "Sorry, I can't understand your query." });
        }
		var answer = result.data[0].text
		await KbAskHistory.create({
			user_id: user_id,
			question: message,
			answer: answer
		})
		return res.status(200).json({
			answer,
		})
	} catch (error) {
		console.log(error)
		return res.status(200).json({ answer: "Sorry, there was a problem answering your request (T500)." });
	}
}


export const AskHistoryGet = async (req: Request, res: Response) => {
	try {
		var user_id = req.body.payload.user_id;
		var history = await KbAskHistory.findAll({ where: { user_id } });
		return res.status(200).json({
			history,
		})
	} catch (error) {
		console.log(error)
		return res.status(200).json({
			msg: 'Error processing request.',
		})
	}
}