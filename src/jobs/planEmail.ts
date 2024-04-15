import moment from "moment"
import cron from "node-cron"
import { Op } from "sequelize"
import { UserOrder } from "../interfaces/user"
import { UserModel, UserOrdersModel } from "../models"
import { PaymentStatus } from "../interfaces/payment"
import { User } from "../interfaces/user"
import { sendEmailNotification, sendEmail, sendAPIEmail } from "../helpers/sendEmail"
import { EmailCondition } from "../interfaces/email"
import { EVERY_DAY, EVERY_MINUTE, EVERY_HOUR } from "../constants/ScheduleConstants"
import UserAnswers from "../models/useranswers"
import { combineArrays } from "../utils"

/** User has left five days*/
// cron.schedule(EVERY_DAY, async () => {
// 	console.log("Running on five day left")
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gte]: moment().subtract(5, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(5, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 		},
// 	})
// 	const userEmail = []
// 	for (let index = 0; index < data.length; index++) {
// 		const user: User = await UserModel.findOne({ where: { user_id: data[index].user_id } })
// 		//const profile: UserProfile = await UserProfileModel.findOne({ where: { user_id: data[index].user_id } })
// 		userEmail.push(user.email)
// 	}
// 	const allMail = userEmail.map((item) => item).join(",")
// 	sendEmailNotification("there", allMail, EmailCondition.FiveDayleft)
// })

/** User has left two days */
// cron.schedule(EVERY_DAY, async () => {
// 	console.log("Running on two day left")
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gte]: moment().subtract(2, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(2, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 		},
// 	})
// 	const userEmail = []
// 	for (let index = 0; index < data.length; index++) {
// 		const user: User = await UserModel.findOne({ where: { user_id: data[index].user_id } })
// 		//const profile: UserProfile = await UserProfileModel.findOne({ where: { user_id: data[index].user_id } })
// 		userEmail.push(user.email)
// 	}
// 	const allMail = userEmail.map((item) => item).join(",")
// 	sendEmailNotification("there", allMail, EmailCondition.TwoDayLeft)
// })

/** User's plan has expired */
// cron.schedule(EVERY_DAY, async () => {
// 	console.log("Running on plan expired")
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gte]: moment().format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().format("YYYY-MM-DD 23:59"),
// 			},
// 		},
// 	})
// 	const userEmail = []
// 	for (let index = 0; index < data.length; index++) {
// 		const user: User = await UserModel.findOne({ where: { user_id: data[index].user_id } })
// 		//const profile: UserProfile = await UserProfileModel.findOne({ where: { user_id: data[index].user_id } })
// 		userEmail.push(user.email)
// 	}
// 	const allMail = userEmail.map((item) => item).join(",")
// 	sendEmailNotification("there", allMail, EmailCondition.PlanExpire)
// })

/** Day 25 after First Paid */
// cron.schedule(EVERY_DAY, async () => {
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		raw: true,
// 		attributes: ["user_id"],
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gte]: moment().subtract(25, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(25, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 		},
// 	})
// 	if(data.length > 0) {
// 		const users = data.map((item: any) => item.user_id)
// 		let mails = await UserModel.findAll({
// 			raw: true,
// 			attributes: ["email"],
// 			where: {
// 				user_id: users
// 			},
// 		})
// 		if(mails.length > 0) {
// 			mails.forEach((mail: any) => {
// 				sendEmail("There", mail.email, EmailCondition.FiveDayleft)
// 			})
// 		}
// 	}
// })

/** Day 28 after First Paid */
// cron.schedule(EVERY_DAY, async () => {
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		raw: true,
// 		attributes: ["user_id"],
// 		where: {
// 			start_date: {
// 				[Op.gte]: moment().subtract(28, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(28, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 			status: PaymentStatus.paid,
// 		},
// 	})
// 	if(data.length > 0) {
// 		const users = data.map((item: any) => item.user_id)
// 		let mails = await UserModel.findAll({
// 			raw: true,
// 			attributes: ["email"],
// 			where: {
// 				user_id: users
// 			},
// 		})
// 		if(mails.length > 0) {
// 			mails.forEach((mail: any) => {
// 				sendEmail("There", mail.email, EmailCondition.TwoDayLeft)
// 			})
// 		}
// 	}
// })

/** Day 31 after First Paid */
// cron.schedule(EVERY_DAY, async () => {
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		raw: true,
// 		attributes: ["user_id"],
// 		where: {
// 			start_date: {
// 				[Op.gte]: moment().subtract(31, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(31, "day").format("YYYY-MM-DD 23:59"),
// 			},
// 			status: PaymentStatus.paid,
// 		},
// 	})
// 	if(data.length > 0) {
// 		const users = data.map((item: any) => item.user_id)
// 		const data2: UserOrder[] = await UserOrdersModel.findAll({
// 			raw: true,
// 			attributes: ["user_id"],
// 			where: {
// 				start_date: {
// 					[Op.gte]: moment().subtract(1, "day").format("YYYY-MM-DD 00:00"),
// 					[Op.lte]: moment().subtract(1, "day").format("YYYY-MM-DD 23:59"),
// 				},
// 				user_id: users,
// 				status: PaymentStatus.paid
// 			},
// 		})
// 		if(data2.length > 0) {
// 			const users2 = data2.map((item: any) => item.user_id)
// 			const userDelayed = users.filter((item: any) => !users2.includes(item))
// 			if(userDelayed.length > 0) {
// 				let mails = await UserModel.findAll({
// 					raw: true,
// 					attributes: ["email"],
// 					where: {
// 						user_id: userDelayed
// 					},
// 				})
// 				if(mails.length > 0) {
// 					mails.forEach((mail: any) => {
// 						sendEmail("There", mail.email, EmailCondition.PlanExpire)
// 					})
// 				}
// 			}
// 		} else {
// 			let mails = await UserModel.findAll({
// 				raw: true,
// 				attributes: ["email"],
// 				where: {
// 					user_id: users
// 				},
// 			})
// 			if(mails.length > 0) {
// 				mails.forEach((mail: any) => {
// 					sendEmail("There", mail.email, EmailCondition.PlanExpire)
// 				})
// 			}
// 		}
// 	}
// })

/** Invoice and Welcome after payment */
// cron.schedule(EVERY_MINUTE, async () => {
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		raw: true,
// 		where: {
// 			start_date: {
// 				[Op.between]: [moment().subtract(3, "minute"), moment().subtract(2, "minute")]
// 			},
// 			status: PaymentStatus.paid,
// 		},
// 	})
// 	if(data.length > 0) {
// 		const users = data.map((item: any) => item.user_id)
// 		let mails = await UserModel.findAll({
// 			raw: true,
// 			attributes: ["email","user_id"],
// 			where: {
// 				user_id: users
// 			},
// 		})
// 		if(mails.length > 0) {
// 			sendAPIEmail(combineArrays(mails,data,"user_id"), EmailCondition.Invoice)
// 			setTimeout( () => { sendAPIEmail(mails, EmailCondition.Welcome) }, 30000 )

// 		}
// 	}
// })

/** After survey, but doesn't try to pay */
// cron.schedule(EVERY_HOUR, async () => {
// 	const data = await UserAnswers.findAll({
// 		raw: true,
// 		attributes: ["user_id"],
// 		where: {
// 			time: {
// 				[Op.gte]: moment().subtract(2, "hour"),
// 				[Op.lt]: moment().subtract(1, "hour"),
// 			},
// 			group_id: {
// 				[Op.ne]: 105
// 			}
// 		},
// 	})
// 	if(data.length > 0) {
// 		const users = data.map((item: any) => item.user_id)
// 		const data2: UserOrder[] = await UserOrdersModel.findAll({
// 			raw: true,
// 			attributes: ["user_id"],
// 			where: {
// 				start_date: {
// 					[Op.gte]: moment().subtract(2, "hour")
// 				},
// 				user_id: users,
// 				status: PaymentStatus.paid
// 			},
// 		})
// 		if(data2.length > 0) {
// 			const users2 = data2.map((item: any) => item.user_id)
// 			const userDelayed = users.filter((item: any) => !users2.includes(item))
// 			if(userDelayed.length > 0) {
// 				let mails = await UserModel.findAll({
// 					raw: true,
// 					attributes: ["email"],
// 					where: {
// 						user_id: userDelayed
// 					},
// 				})
// 				if(mails.length > 0) {
// 					sendAPIEmail(mails, EmailCondition.DidnTryPayment)
// 				}
// 			}
// 		} else {
// 			let mails = await UserModel.findAll({
// 				raw: true,
// 				attributes: ["email"],
// 				where: {
// 					user_id: users
// 				},
// 			})
// 			if(mails.length > 0) {
// 				sendAPIEmail(mails, EmailCondition.DidnTryPayment)
// 			}
// 		}
// 	}
// })

/** Welcome after Free Survey */
// cron.schedule(EVERY_MINUTE, async () => {
// 	const data = await UserAnswers.findAll({
// 		raw: true,
// 		attributes: ["user_id"],
// 		where: {
// 			time: {
// 				[Op.gte]: moment().subtract(3, "minute"),
// 				[Op.lt]: moment().subtract(2, "minute"),
// 			},
// 			group_id: 105
// 		},
// 	})
// 	if(data.length > 0) {
// 		const users = data.map((item: any) => item.user_id)
// 		let mails = await UserModel.findAll({
// 			raw: true,
// 			attributes: ["email","user_id"],
// 			where: {
// 				user_id: users
// 			},
// 		})
// 		if(mails.length > 0) {
// 			sendAPIEmail(mails, EmailCondition.Welcome_Free)
// 		}
// 	}
// })