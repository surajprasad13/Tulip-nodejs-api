import { Request, Response } from "express"
import { UserOrdersModel } from "../../models"
import { fetchSubcription, cancelSubscription as cancel } from "../../services/stripe"

const getSubscription = async (req: Request, res: Response) => {
	try {
		const id = req.body.stripeUserId

		const response = await fetchSubcription(id)

		res.send({
			data: response.data,
			error: {
				code: 200,
				message: "success",
			},
		})
	} catch (error) {
		res.status(400).send({ error })
	}
}

const updateSubscription = async (req: Request, res: Response) => {
	try {
		res.send({ message: "update subscription" })
	} catch (error) {
		res.status(400).send({ error })
	}
}

const cancelSubscription = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id
		const id = req.body.subscriptionId

		const response = await cancel(id)
		await UserOrdersModel.update(
			//@ts-ignore
			{ status: response.data.status, end_date: response.data.canceled_at },
			{ where: { user_id, product_id: req.body.product_id } }
		)

		res.send({
			data: response,
			error: {
				code: 200,
				message: "success",
			},
		})
	} catch (error) {
		res.status(400).send({ error: "Already cancelled" })
	}
}

export { getSubscription, cancelSubscription, updateSubscription }
