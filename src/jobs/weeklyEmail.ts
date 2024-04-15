import moment from "moment"
import cron from "node-cron"
import { Op } from "sequelize"
import { SubscriptionUser, UserOrder } from "../interfaces/user"
import { UserModel, UserOrdersModel } from "../models"
import { PaymentStatus } from "../interfaces/payment"
import { User } from "../interfaces/user"
import { sendEmailNotification, sendSubscriptionEmail } from "../helpers/sendEmail"
import { SubscriptionEmail, WeeklyCondition } from "../interfaces/email"
import { EVERY_DAY, EVERY_WEEK } from "../constants/ScheduleConstants"
import SubscriptionModel from "../models/newsletter_template"
import SubscriptionUserModel from "../models/user/newsletterSubscription"

/** Weekly check in on five day */
// cron.schedule(EVERY_DAY, async () => {
// 	console.log("Running on five days after purchase plan")
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gt]: moment().subtract(5, "day").format("YYYY-MM-DD 00:00"),
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
// 	sendEmailNotification("there", allMail, WeeklyCondition.FiveDay)
// })

/** Weekly check in on eight day */
// cron.schedule(EVERY_DAY, async () => {
// 	console.log("Running on after sending five days when they have not responded")
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gt]: moment().subtract(8, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(8, "day").format("YYYY-MM-DD 23:59"),
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
// 	sendEmailNotification("Animesh", allMail, WeeklyCondition.EightDay)
// })

/** Weekly check in on 2 week */
// cron.schedule(EVERY_DAY, async () => {
// 	console.log("Running on two weeks")
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gt]: moment().subtract(14, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(14, "day").format("YYYY-MM-DD 23:59"),
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
// 	sendEmailNotification("Animesh", allMail, WeeklyCondition.FourteenDay)
// })

/** Weekly check in on 3 week */
// cron.schedule(EVERY_DAY, async () => {
// 	console.log("Running in 3 weeks")
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gt]: moment().subtract(21, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(21, "day").format("YYYY-MM-DD 23:59"),
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
// 	sendEmailNotification("Animesh", allMail, WeeklyCondition.TwentyOneDay)
// })

/** Weekly check in on 4 week */
// cron.schedule(EVERY_DAY, async () => {
// 	console.log("Running in 4 weeks")
// 	const data: UserOrder[] = await UserOrdersModel.findAll({
// 		where: {
// 			status: PaymentStatus.paid,
// 			start_date: {
// 				[Op.gt]: moment().subtract(28, "day").format("YYYY-MM-DD 00:00"),
// 				[Op.lte]: moment().subtract(28, "day").format("YYYY-MM-DD 23:59"),
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
// 	sendEmailNotification("there", allMail, WeeklyCondition.TwentyEightDay)
// })

/** Weekly newsletter  */

// cron.schedule("*/10 * * * * *", async () => {
// 	// console.log("Running on html")

// 	const data: SubscriptionEmail[] = await SubscriptionModel.findAll({
// 		limit: 1,
// 		where: {
// 			[Op.gt]: moment().format("YYYY-MM-DD 00:00"),
// 			[Op.lte]: moment().subtract(3, "day").format("YYYY-MM-DD 23:59"),
// 		},
// 		order: [["createdAt", "DESC"]],
// 	})
// 	const user: SubscriptionUser[] = await SubscriptionUserModel.findAll({})
// 	console.log(JSON.stringify(data))
// 	//sendSubscriptionEmail(email, template)
// })
