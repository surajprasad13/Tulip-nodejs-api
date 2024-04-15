import { Request, Response } from "express"
import ContactModel from "../models/contact"

const postContact = async (req: Request, res: Response) => {
	try {
		const [user, created] = await ContactModel.findOrCreate({ where: req.body })

		if (created) {
			res.status(201).send({
				data: user,
				error: {
					code: 201,
					message: "We have saved your response",
				},
			})
		} else {
			res.status(200).send({
				data: user,
				error: {
					code: 200,
					message: "We have already saved you information",
				},
			})
		}
	} catch (error) {
		res.status(400).send({ error })
	}
}

export { postContact }
