import { Request, Response } from "express"
import { Op } from "sequelize"
import { StripeModel, UserModel, UserOrdersModel, UserProfileModel } from "../../models"
import UserFollowupModel from "../../models/notification/user_followup"
import UserAnswers from "../../models/useranswers"

import {
	checkoutSession,
	createPaymentMethod,
	fetchCouponDetail,
	fetchPriceDetail,
	createPortalSession as portalSession,
	createCustomer as create,
	fetchSubcription,
	fetchBilling,
} from "../../services/stripe"

import * as subscription from "./subscription"

const createCustomer = async (req: Request, res: Response) => {
	try {
		delete req.body.payload

		const user_data = await UserModel.findOne({
			where: {
				email: req.body.email,
				[Op.not]: {
					stripe_user_id: "null",
				},
			},
		})

		if (user_data != null) return res.send({ message: "User id already exist" })

		const user = await create(req.body)

		await UserModel.update({ stripe_user_id: user.id }, { where: { email: req.body.email } })

		res.status(201).send({
			data: { ...user },
			error: {
				code: 201,
				message: "success",
			},
		})
	} catch (error) {
		res.status(400).send({
			error: {
				code: 400,
				message: "fail",
			},
		})
	}
}

const getPlans = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id
		const data = await UserModel.findOne({ where: { user_id } })
		const plans = await fetchSubcription(data.stripe_user_id)
		res.send({
			data: plans.data,
			error: {
				code: 200,
				message: "success",
			},
		})
	} catch (error) {
		res.status(400).send({ error })
	}
}

const createPayment = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id

		const userData = await UserModel.findOne({ where: { user_id }, raw: true })
		const userProfileData = await UserProfileModel.findOne({ where: { user_id }, raw: true })

		let stripeUserId = userData.stripe_user_id

		if(!stripeUserId){
			stripeUserId = (await create({ email: userData.email, name: userProfileData.first_name }))?.id
			await UserModel.update({ stripe_user_id: stripeUserId }, { where: { user_id } })
		}

		const session = await createPaymentMethod(
			req.body.items ?? (await buildItems(user_id)),			
			stripeUserId,
			req.body.mode,
			user_id
		)
		
		res.send({ url: session.url })
	} catch (error) {
		console.log(error);		
		res.status(400).send({ error })
	}
}

async function buildItems(userId: number){
	const groupId = (await UserAnswers.findOne({ where: { user_id: userId }, order: [["id", "DESC"]], raw: true }))?.group_id

	if(!groupId){
		throw new Error("No group id found")
	}

	const price = (await StripeModel.findOne({ where: { group_id: groupId }, raw: true }))?.price

	if(!price){
		throw new Error("No price found")
	}

	return [{
		price,
		quantity: 1
	}]
}

const createPortalSession = async (req: Request, res: Response) => {
	try {
		const session_id = req.query.session_id as string
		const session = (await portalSession(session_id)) as string
		res.send({ url: session })
	} catch (error) {
		res.status(400).send({ error })
	}
}

const getCheckoutSession = async (req: Request, res: Response) => {
	try {
		const data = await checkoutSession(req.query.session_id as string)
		res.send({ data })
	} catch (error) {
		res.status(400).send({ error })
	}
}

const paymentSuccess = async (req: Request, res: Response) => {
	try {
		let data: any

		const user_id = req.body.payload.user_id

		const session_data = await checkoutSession(req.query.session_id as string)
		if (session_data.subscription) {
			const subscription = await fetchSubcription(session_data.customer as string)
			const value = subscription.data[0]
			data = await UserOrdersModel.findOrCreate({
				where: {					
					product_id: req.query.product_id??(await getProductId(user_id)),
					user_id: user_id,
					amount: Number(session_data.amount_total) / 100,
					stripeId: session_data.id,
					subscription: session_data.subscription,
					url: session_data.url,
					status: session_data.payment_status,
					start_date: new Date(value.current_period_start * 1000),
					end_date: new Date(value.current_period_end * 1000),
				},
			})
		} else {
			data = await UserOrdersModel.findOrCreate({
				where: {
					product_id: req.query.product_id??(await getProductId(user_id)),
					user_id: user_id,
					amount: Number(session_data.amount_total) / 100,
					stripeId: session_data.id,
					subscription: session_data.subscription,
					url: session_data.url,
					status: session_data.payment_status,
					//@ts-ignore
					start_date: new Date(session_data.created * 1000),
					end_date: new Date(session_data.expires_at * 1000),
				},
			})
		}

		const followup = await new UserFollowupModel({ user_id, followup_type_id: 1 })
		await followup.save()
		res.status(200).send({ message: "Successfully inserted", data })
	} catch (error) {
		console.log(error);
		
		res.status(400).send({ error })
	}
}

const paymentFail = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id
		const session_data = await checkoutSession(req.query.session_id as string)
		const data = await UserOrdersModel.findOrCreate({
			where: {
				user_id: user_id,
				product_id: req.query.product_id??(await getProductId(user_id)),
				amount: Number(session_data.amount_total) / 100,
				stripeId: session_data.id,
				url: session_data.url,
				status: session_data.payment_status,
			},
		})
		res.status(200).send({ message: "Successfully inserted", data })
	} catch (error) {
		res.status(400).send({ error })
	}
}

async function getProductId(userId: number){
	const groupId = (await UserAnswers.findOne({ where: { user_id: userId }, order: [["id", "DESC"]], raw: true }))?.group_id

	if(!groupId){
		throw new Error("No group id found")
	}

	const productId = (await StripeModel.findOne({ where: { group_id: groupId }, raw: true }))?.id

	if(!productId){
		throw new Error("No product id found")
	}

	return productId
}

const getCouponCodeDetail = async (req: Request, res: Response) => {
	try {
		const id = req.params.id as string
		const coupon = await fetchCouponDetail(id)

		res.send({
			data: { ...coupon },
			error: {
				code: 200,
				message: "success",
			},
		})
	} catch (error) {
		res.status(400).send({
			error: {
				code: 400,
				message: "fail",
			},
		})
	}
}

const getPriceDetail = async (req: Request, res: Response) => {
	try {
		const id = req.params.id
		const price = await fetchPriceDetail(id)
		res.send({
			data: { ...price },
			error: {
				code: 200,
				message: "success",
			},
		})
	} catch (error) {
		res.status(400).send({
			error: {
				code: 400,
				message: "fail",
			},
		})
	}
}

const fetchUserBilling = async (req: Request, res: Response) => {
	fetchBilling(req.body.stripeUserId)
		.then((data) => {
			res.send({ data })
		})
		.catch((error) => {
			res.send({ error })
		})
}

export {
	createCustomer,
	getPlans,
	createPayment,
	createPortalSession,
	paymentSuccess,
	paymentFail,
	getCheckoutSession,
	getCouponCodeDetail,
	subscription,
	getPriceDetail,
	fetchUserBilling,
}
