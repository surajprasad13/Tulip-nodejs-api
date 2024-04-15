import { Request, Response } from "express"
import LeadModel from "../models/lead"
import { sign } from "jsonwebtoken"
import config from "../config"

export const createLead = async (req: Request, res: Response) => {
	try {
		const { userFirstName: firstname, userEmail: email } = req.body
		const date_created = new Date()
		const status = "lead"

		const data = {
			firstname,
			email,
			date_created,
			status,
		}

		const [user, created] = await LeadModel.findOrCreate({ where: { firstname, email, status }, raw: true })

		if (created) {
			res.status(201).send({
				data: { user, token: createToken(user.lead_id) },
				error: {
					code: 201,
					message: "Lead created",
				},
			})
		} else {
			res.status(200).send({
				data: { user, token: createToken(user.lead_id) },
				error: {
					code: 200,
					message: "We have already saved your information",
				},
			})
		}
	} catch (error) {
		console.log(error)
		res.status(400).send({ error })
	}
}

function createToken(lead_id: number) {
	const expiration = new Date()
	expiration.setHours(expiration.getHours() + 24)

	return sign(
		{
			lead_id,
		},
		config.JWT_PRIVATE_KEY ?? "",
		{ expiresIn: "24h" }
	)
}
