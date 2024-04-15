import { Request, Response } from "express"
import { UserModel, UserOrdersModel, UserProfileModel } from "../models"
import { fetAllSubscription, fetchAllBalance, fetchAllCustomer, fetchAllPayments } from "../services/stripe"
import { subscription } from "./stripe"

const getSubscription = async (req: Request, res: Response) => {
	try {
		const limit = req.query.limit == undefined ? 10 : req.query.limit

		const subscriptions = await fetAllSubscription(Number(limit))

		const customersIds = subscriptions.data.map(sub => sub.customer)
		
		const users = (await UserModel.findAll({raw: true, where: { stripe_user_id: customersIds } }) || [])

		const userData = users.reduce((acc:any, user:any) => {
			acc[user.stripe_user_id] = user
			return acc
		},{})		

		const userIds = Object.values(userData).map((user: any) => user.user_id)

		const usersProfileData = (await UserProfileModel.findAll({raw: true, where: { user_id: userIds } }) || [])

		const userProfileData = usersProfileData.reduce((acc:any, user:any) => {
			acc[user.user_id] = user
			return acc
		},{})

		
		subscriptions.data.forEach((subscription: any) => {
			subscription.user_id = userData[subscription.customer]?.user_id
			subscription.user_first_name = userProfileData[subscription.user_id]?.data?.first_name
			subscription.user_last_name = userProfileData[subscription.user_id]?.data?.last_name
			subscription.user_profile_image = userProfileData[subscription.user_id]?.profile_image			
		});
		

		res.send(subscriptions)
	} catch (error) {
		res.status(400).send({ error })
	}
}

const getBalance = async (req: Request, res: Response) => {
	try {
		const limit = Number(req.query.limit) ?? 10

		const balance = await fetchAllBalance(Number(limit))

		res.send(balance)
	} catch (error) {
		res.status(400).send({ error })
	}
}

const getUsers = async (req: Request, res: Response) => {
	try {
		const limit = req.query.limit == undefined ? 10 : req.query.limit

		const user = await fetchAllCustomer(Number(limit))

		res.send(user)
	} catch (error) {
		res.status(400).send(error)
	}
}

const getPayments = async (req: Request, res: Response) => {
	try {
		const limit = req.query.limit == undefined ? 10 : req.query.limit

		const payment = await fetchAllPayments(Number(limit))

		res.send(payment)
	} catch (error) {
		res.status(400).send(error)
	}
}

const getLastPlans = async (req: Request, res: Response) => {
	try {
		const { Op } = require('sequelize');
		const id_user = req.params.id
		const today = new Date()  
		const priorDate = new Date().setDate(today.getDate() - 32)
		const plans = await UserOrdersModel.findAll({
			where: {
			  user_id: id_user,
			  updatedAt: {
				[Op.between] : [priorDate , today]
			  },
			  status: {
				[Op.in] : ['paid','success']
			  }
			},
		  })
		  if (plans && plans.length > 0) {
			res.json(plans)
		  } else {
			res.status(204).json({
			  msg: `Plans for user ${id_user} not found`,
			})
		}
	} catch (err: any) {
		return res.status(500).json({
		  msg: 'INTERNAL ERROR',
		})
	}
}

export { getSubscription, getBalance, getUsers, getPayments, getLastPlans }
