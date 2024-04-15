import { NextFunction, Request, Response } from "express"
import {
	NotificationModel,
	QuestionsModel,
	StripeModel,
	UserAnswerModel,
	UserModel,
	UserNotificationModel,
	UserOrdersModel,
	UserProfileModel,
} from "../models"
import { ACL, SpaceName, UserProfile } from "../types/interface"
import { UploadFileToS3 } from "../services/s3"
import { generateLinks } from "../services/firebase"
import { getLoggedInUserId } from "../utils"

const getUserData = async (req: Request, res: Response, next: NextFunction) => {
	const user_id = req.body.payload.user_id

	try {
		const userModel = await UserModel.findOne({ where: user_id })

		const data = await UserProfileModel.findOne({
			where: {
				user_id,
			},
		})

		const plans = await getUserPlans(user_id)

		const user = data as UserProfile

		if (user) {
			res.send({
				data: {
					userDetailsObject: {
						userID: user.user_id,
						stripeUserId: userModel.stripe_user_id,
						userFirstName: user.first_name,
						userLastName: user.last_name,
						userEmail: userModel.email,
						userPhoneCountryCode: user.phone_code,
						userPhoneNumber: user.phone,
						userProfileImage: user.profile_image,
						userDOB: user.dob,
						userAge: user.sex,
						userAddress1: user.address_line1,
						userAddress2: user.address_line2,
						userAddressCity: user.address_city,
						userAddressZip: user.address_zip,
						userAddressState: user.address_state,
						userAddressCountry: user.address_country,
						userAddressCode: user.address_zip,
						userTimezone: user.timezone,
					},
					plansArray: plans,
				},
				error: {
					code: 200,
					message: "success",
				},
			})
		} else if (plans) {
			res.send({
				data: {
					userDetailsObject: {
						userId: userModel.user_id,
						stripeUserId: userModel.stripe_user_id,
						userEmail: userModel.email,
					},
					plansArray: plans,
				},
				error: {
					code: 200,
					message: "success",
				},
			})
		} else {
			res.send({
				data: {
					userDetailsObject: {
						userId: userModel.user_id,
						stripeUserId: userModel.stripe_user_id,
						userEmail: userModel.email,
					},
					plansArray: [],
				},
				error: {
					code: 200,
					message: "success",
				},
			})
		}
	} catch (error) {
		res.status(400).send({
			error: {
				code: 400,
				message: "fail",
			},
		})
	}
}

const getSurveyAnswers = async (req: Request, res: Response) => {
	const user_id = req.body.payload.user_id

	const userSurveyAnswer = await UserAnswerModel.findAll({ where: { user_id: user_id } })

	if (userSurveyAnswer) {
		res.send({
			data: userSurveyAnswer[userSurveyAnswer.length - 1],
			error: {
				code: 200,
				message: "success",
			},
		})
	} else {
		res.status(400).send({
			error: {
				code: 400,
				message: "fail",
			},
		})
	}
}

const updateUser = async (req: Request, res: Response) => {
	try {
		const updates = Object.keys(req.body)
		const allowedUpdates = [
			"payload",
			"first_name",
			"last_name",
			"sex",
			"dob",
			"phone",
			"address_line1",
			"address_line2",
			"address_city",
			"address_zip",
			"address_state",
			"address_country",
			"communication_preference",
			"timezone",
			"device_token",
		]

		const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

		if (!isValidOperation) {
			return res.status(400).send({ error: "Invalid Updates", code: 400 })
		}

		const user_id = req.body.payload.user_id
		const plans = await getUserPlans(user_id)
		const userModel = await UserModel.findOne({ where: { user_id } })

		delete req.body.payload

		await UserProfileModel.update(req.body, { where: { user_id } })

		const user: UserProfile = await UserProfileModel.findOne({ where: { user_id } })

		res.send({
			data: {
				userDetailsObject: {
					userID: userModel.user_id,
					userEmail: userModel.email,
					stripeUserId: userModel.stripe_user_id,
					userFirstName: user.first_name,
					userLastName: user.last_name,
					userPhoneNumber: user.phone,
					userProfileImage: user.profile_image,
					userDOB: user.dob,
					userAge: user.sex,
					userAddress1: user.address_line1,
					userAddress2: user.address_line2,
					userAddressCity: user.address_city,
					userAddressZip: user.address_zip,
					userAddressState: user.address_state,
					userAddressCountry: user.address_country,
					userAddressCode: user.address_zip,
					userTimezone: user.timezone,
				},
				plansArray: plans ?? [],
			},
			error: {
				code: 200,
				message: "success",
			},
		})
	} catch (error) {
		console.log(error)
		res.send({ error })
	}
}

const getUserMessages = async (req: Request, res: Response, next: NextFunction) => {
	const user_id = req.body.payload.user_id
	try {
		const questions = await QuestionsModel.findAll({ raw: true })
		const answers = await UserAnswerModel.findAll({
			where: { user_id },
		})

		let data = answers[0].data.map((item: any) => {
			let question = questions.find((data: any) => data.id_question == item.question_id)
			return {
				messageObject: {
					userResponseObject: {
						responseId: item.question_id,
						responseText: item.values,
						timeStamp: new Date(),
					},
					messageDetails: {
						id: question.id_question,
						fullText: question.question,
					},
					optionsDetails: {
						optionsType: question.type,
						optionsArray: question.options?.choices,
					},
				},
			}
		})

		res.send({
			messagesList: data,
			response: 200,
			responseMessage: {
				type: "",
				status: "",
				message: "",
			},
		})
	} catch (error) {
		res.status(400).send({ error })
	}
}

const getUserNotifications = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id

		const limit = +(req.query.limit ?? 10)
		const offset = +(req.query.offset ?? 0)

		UserNotificationModel.hasMany(NotificationModel, { foreignKey: "notification_id" })
		NotificationModel.belongsTo(UserNotificationModel, { foreignKey: "notification_id" })

		const user_notifications = await UserNotificationModel.findAndCountAll({
			where: { user_id },
			limit,
			offset,
			include: [NotificationModel],
		})

		const { count, rows: data } = user_notifications

		let value = []

		if (data.length > 0) {
			value = data.map((item: any) => {
				return {
					notificationDetailsObject: {
						notificationID: item.notification_id,
						notificationTitle: item.notifications[0].name,
						notificationShortDescription: item.notifications[0].title_html,
						notificationLongDescription: item.notifications[0].description_html,
						notificationPreviewImageSmall: item.notifications[0].URL,
						notificationPreviewImageLarge: item.notifications[0].URL,
						notificationRedirectType: "",
						notificationStatus: item.status,
					},
				}
			})
		}

		res.send({
			total: count,
			data: value,
			error: {
				code: 200,
				message: "success",
			},
		})
	} catch (error) {
		res.status(400).send(error)
	}
}

const updateNotificationStatus = async (req: Request, res: Response) => {
	try {
		const notification_id = req.body.notification_id
		const user_id = req.body.payload.user_id
		const response = await UserNotificationModel.update({ status: "READ" }, { where: { user_id, notification_id } })
		res.send({ message: "Marked as READ" })
	} catch (error) {
		res.status(400).send({ error })
	}
}

const getUserPlans = async (user_id: string) => {
	try {
		const plans = await StripeModel.findAll({ raw: true })
		const orders = await UserOrdersModel.findAll({ where: { user_id } })

		const data = orders.map((order: any) => {
			let item = plans.find((plan: any) => plan.id == order.product_id)
			return {
				planId: item.id,
				planGroupId: item.group_id,
				planName: item.name,
				planPrice: item.price,
				planPriceLabel: item.priceLabel,
				planFullDesc: item.description,
				planShortDesc: item.name,
				planPreviewImage: item.image,
				planFullImage: item.image,
				planStartDate: order.start_date,
				planEndDate: order.end_date,
				planStatus: order.status,
				planPurchaseDate: order.createdAt,
				planCouponCode: item.coupon_code,
				planOrderURL: item.url,
			}
		})
		return data
	} catch (error) {
		return error
	}
}

const uploadImage = async (req: Request, res: Response) => {
	try {
		const originalnameParts = (req.file?.originalname ?? "").split(".")
		if (req.file) {
			const uploaded: any = await UploadFileToS3(
				SpaceName.UserProfile,
				ACL.public,
				req.file.buffer,
				req.body.userId,
				originalnameParts[originalnameParts.length - 1] ?? "",
				req.file.mimetype
			)

			if (uploaded.Url) {
				await UserProfileModel.update({ profile_image: uploaded.Url }, { where: { user_id: req.body.userId } })

				res.send({
					data: {
						url: uploaded.Url,
					},
					error: { message: "Image uploaded successfully", code: 200 },
				})
			} else {
				res.send({ message: "Error in uploading image" })
			}
		} else {
			res.send({ message: "Upload an image" })
		}
	} catch (error) {
		res.status(400).send({ error })
	}
}

const getDownloadLink = async (req: Request, res: Response) => {
	try {
		const link = await generateLinks(req.body.payload.user_id)
		res.send({ link: link.shortLink })
	} catch (error) {
		res.status(400).send({ error })
	}
}

const updateSurveyStatus = async (req: Request, res: Response) => {
	try {
		const validStatus = ["NOT-STARTED", "INCOMPLETE", "COMPLETED"]
		const userId = getLoggedInUserId(req)
		const status = req.body.status_enum

		if (!validStatus.includes(status)) {
			return res.status(400).json({
				msg: "Provide a valid status: NOT-STARTED, INCOMPLETE, COMPLETED",
			})
		}

		await UserModel.update(
			{ user_survey_status: status },
			{
				where: { user_id: userId },
			}
		)

		res.status(200).send()
	} catch (error) {
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

const fetchUserPlans = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id
		const data = await getUserPlans(user_id)
		res.send({ data })
	} catch (error) {
		res.status(400).send({ error })
	}
}

export {
	getUserData,
	getUserMessages,
	updateUser,
	getUserNotifications,
	getUserPlans,
	updateNotificationStatus,
	uploadImage,
	getDownloadLink,
	updateSurveyStatus,
	getSurveyAnswers,
	fetchUserPlans,
}

export default {}
