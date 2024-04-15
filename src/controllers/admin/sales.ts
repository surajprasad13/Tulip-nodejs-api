import { Request, Response } from "express"
import { StripeModel, UserModel, UserOrdersModel } from "../../models"
import { Stripe } from "../../types/interface"

export const getPlans = async (req: Request, res: Response) => {
	try {
		const data = await StripeModel.findAll()

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