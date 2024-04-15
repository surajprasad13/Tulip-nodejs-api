import { Request, Response } from "express"
import { StripeModel } from "../models"
import { Stripe } from "../types/interface"

const fetchPlans = async (req: Request, res: Response) => {
	try {
		const group_id = req.query.group_id

		let data

		if (group_id) {
			data = await StripeModel.findAll({ where: { group_id } })
		} else {
			data = await StripeModel.findAll({})
		}

		const value = data.map((item: Stripe) => {
			return {
				planDetails: {
					planId: item.id,
					planGroupId: item.group_id,
					planName: item.name,
					planPrice: item.price,
					planPriceLabel: item.priceLabel,
					planFullDesc: item.description,
					planShortDesc: item.name,
					planPreviewImage: item.image,
					planFullImage: item.image,
					planStartDate: item.start_date,
					planEndDate: item.end_date,
					planStatus: item.type,
					planPurchaseDate: "",
					planCouponCodes: item.coupon_code,
					planOrderURL: item.url,
				},
			}
		})
		res.send({
			data: value,
			error: {
				code: 200,
				message: "success",
			},
		})
	} catch (error) {
		res.status(400).send({ error })
	}
}

export { fetchPlans }
