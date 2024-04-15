import { Request, Response } from "express"
import { sendAPIEmail } from "../../helpers/sendEmail"
import { EmailCondition } from "../../interfaces/email"
import UserTracker from "../../models/user/userTracker"
import { getUserEmail } from "../../utils/getUserEmail"
import { getTreatment } from "./treatment"

export const postSymptom = async (req: Request, res: Response) => {
	try {
		const id_user = req.body.payload.user_id
		delete req.body.payload
		const insert = {
			user_id: id_user,
			...req.body
		}

		const symptom = new UserTracker(insert)
		await symptom.save()
		const treatment = await getTreatment(symptom?.dataValues?.symptom,symptom?.dataValues?.id)
		const series = await UserTracker.findAll({
			where: {
				user_id: id_user
			},
			order: [["start_date"]],
		})
		if (series.length <= 1) {
			const email = await getUserEmail(id_user)
			const mails = [{
				email: email,
				health_tip_title: treatment.health_tip_title,
				health_tip_description: treatment.health_tip_description,
			}]
			await sendAPIEmail(mails, EmailCondition.RecommendedTreatment)
		}else{
			console.log("Skipping sending Health Recommendations");
		}
		res.send({
			msg: "Symptom saved successfully",
			recommended_treatment: treatment
		})
	} catch (error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}
}

export const getSymptom = async (req: Request, res: Response) => {
	const id_user = req.body.payload.user_id
	const series = await UserTracker.findAll({
		where: {
			user_id: id_user
		},
		order: [["start_date"]],
	})

	if (series) {
		res.json(series)
	} else {
		res.status(204).json({
			msg: `Symptoms not found`,
		})
	}
}
