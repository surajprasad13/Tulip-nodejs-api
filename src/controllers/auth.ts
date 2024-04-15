import { Request, Response } from "express"

import { generateToken } from "../middlewares/jwt-validate"
import { UserModel, UserProfileModel } from "../models"
import { UserProfile, UserData } from "../types/interface"
import { getUserPlans } from "./user"
import { CheckPassword, comparePassword, hashPassword } from "../utils"
import transporter from "../services/mail"
import { EmailCondition } from "../interfaces/email"
import { sendAPIEmail } from "../helpers/sendEmail"
import { postTongueAnalysisTransfer } from "./tongue-analysis"
import { verify } from "jsonwebtoken"
import config from "../config"
import UserAnswers from "../models/useranswers"


export const createUser = async (req: Request, res: Response) => {
	try {
		var email = req.body.email;
		var isLabUser = req.body.isLabUser;

	  const isPasswordValid = CheckPassword(req.body.password)
	  //const lead_id = getLeadId(req)
  
	  if (!isPasswordValid) {
		return res.status(400).send({
		  code: 'PASSWORD_INVALID',
		  msg: 'Password not contains uppercase | lowercase | special character',
		})
	  }
  
	  const password = hashPassword(req.body.password)
  
	  let result
  
	  try {
		result = await UserModel.create({
		  email: email,
		  password_hash: password,
		//  lead_id,
		  user_type: 'PASSWORD',
		})
	  } catch (err) {
		if ((err as any)?.name === 'SequelizeUniqueConstraintError' && (err as any)?.fields?.email_UNIQUE) {
		  return res.status(400).send({
			code: 'EMAIL_ALREADY_EXISTS',
			msg: 'User already exist',
		  })
		} else {
		  throw err
		}
	  }
  
	  const user_id = result['null'] //I don't know why sequelize create method returns the id of the created row on a property called "null"
  
	//   if (lead_id && user_id) {
	// 	await changeAnswersFromLeadToUser(lead_id, user_id)
	//   }

	// Pre-register logic
	  var tokenTemporary = req.headers['authorization-temp'];
	  if (tokenTemporary){
		var temporaryPayload = verify(tokenTemporary as string, config.JWT_PRIVATE_KEY ?? " ") as any;
		postTongueAnalysisTransfer(user_id, temporaryPayload.user_id)
	  }

  
	  let token = generateToken(user_id)
	  await UserProfileModel.create({ user_id, first_name: req.body.name, isLabUser})
  
	  return res.send({
		data: {
		  access_token: token,
		  userDetailsObject: {
			userId: user_id,
			userFirstName: req.body.name,
			userEmail: email,
			isLabUser: isLabUser
		  },
		},
		plans: [],
	  })
	} catch (error) {
	  console.log(error)
	  return res.status(500).send({ message: 'INTERNAL ERROR' })
	}
  }


export const verifyEmail = async (req: Request, res: Response) => {
	try {
		const otp = (await UserModel.findOne({ where: { email: req.body.email }, raw: true }))?.otp

		if (req.body.otp === otp) {
			await UserModel.update({ email_verified: 1 }, { where: { email: req.body.email } })
			return res.send({ msg: "Email verified successfully" })
		} else {
			return res.send({ msg: "Invalid otp" })
		}
	} catch (error) {
		console.log(error)

		res.status(500).send({ message: "INTERNAL ERROR" })
	}
}

export const loginUser = async (req: Request, res: Response) => {
	const userData = await UserModel.findOne({ where: { email: req.body.email } }) as UserData

	if (userData == null) {
		res.status(400).send({
			errors: [
				{
					code: 400,
					msg: "User not found",
				},
			],
		})
	} else {
		if (userData.password_hash) {
			const compare = comparePassword(req.body.password, userData.password_hash)

			if (!compare) {
				res.status(400).send({
					errors: [
						{
							code: 400,
							msg: "Password is incorrect",
						},
					],
				})
			} else {
				const token = generateToken(userData.user_id)
				const user_data = await UserProfileModel.findOne({
					where: {
						user_id: userData.user_id,
					},
				})

				const plans = await getUserPlans(userData.user_id.toString())

				let isFreeLongCovidUser = false

				if(!plans?.length){
					const freeLongCovidAnswers = await UserAnswers.findOne({
						raw: true,
						where: {
							user_id: userData.user_id,
							group_id: 105
						},
					})

					isFreeLongCovidUser = !!freeLongCovidAnswers
				}

				const user = user_data as UserProfile

				if (user) {
					res.send({
						data: {
							access_token: token,
							userDetailsObject: {
								userID: user.user_id,
								stripeUserId: userData.stripe_user_id,
								userFirstName: user.first_name,
								userLastName: user.last_name,
								userEmail: userData.email,
								userProfileImage: user.profile_image,
								userPhoneCountryCode: user.phone_code,
								userPhoneNumber: user.phone,
								userDOB: user.dob,
								userSex: user.sex,
								userAddress1: user.address_line1,
								userAddress2: user.address_line2,
								userAddressCity: user.address_city,
								userAddressZip: user.address_zip,
								userAddressCode: user.address_zip,
								userAddressState: user.address_state,
								userAddressCountry: user.address_country,
								userTimezone: user.timezone,
								lastLoggedIn: userData.last_login,
								isLabUser: user.isLabUser,
								isFreeLongCovidUser
							},
							plansArray: plans,
						},
						error: {
							code: 200,
							msg: "success",
						},
					})
				} else {
					res.send({
						data: {
							access_token: token,
							userDetailsObject: {
								userId: userData.user_id,
								stripeUserId: userData.stripe_user_id,
								userEmail: userData.email,
								userEmailVerified: userData.email_verified,
								lastLoggedIn: userData.last_login,
								isLabUser: false
							},
							plans: plans,
						},
						error: {
							code: 200,
							msg: "success",
						},
					})
				}
			}
		} else {
			res.status(400).send({
				errors: [
					{
						code: 400,
						msg: "User not found",
					},
				],
			})
		}
	}
}

export const resetSend = async (req: Request, res: Response) => {
	const email = await UserModel.findOne({ where: { email: req.body.email } })

	if (!email) {
		return res.send()
	}

	let otp = Math.random()
	otp = Math.floor(otp * 1000000)

	await UserModel.update(
		{ otp, attempts: 0 },
		{
			where: { email: req.body.email },
		}
	)
	const mails = [{
		email: req.body.email,
		otp
	}]
	await sendAPIEmail(mails, EmailCondition.Otp)
	res.send({msg: "OTP Sent"})
}

export const resetPassword = async (req: Request, res: Response) => {
	const otp = (await UserModel.findOne({ where: { email: req.body.email }, raw: true }))?.otp

	if (req.body.otp == otp) {
		const check = CheckPassword(req.body.password)
		if (check) {
			const password = hashPassword(req.body.password)
			await UserModel.update({ password_hash: password }, { where: { email: req.body.email } })
			return res.send({ msg: "SUCCESS" })
		} else {
			return res.send({ msg: "INVALID_PASSWORD" })
		}
	} else {
		await UserModel.update(
			{ attempts: 0, otp: '0000' },
			{ where: { email: req.body.email } }
		)
		return res.send({ msg: "INVALID_OTP" })
	}
}

export const socialLogin = async (req: Request, res: Response) => {
	try {
		let token: string = ""

		const user = await UserModel.findOne({
			where: {
				email: req.body.email,
			},
		})

		if (user) {
			const user_data = await UserProfileModel.findOne({
				where: {
					user_id: user.user_id,
				},
			})

			const plans = await getUserPlans(user.user_id)
			const userProfile = user_data as UserProfile
			token = generateToken(user.user_id)

			res.send({
				data: {
					access_token: token,
					userDetailsObject: {
						userID: userProfile.user_id,
						stripeUserId: user.stripe_user_id,
						userFirstName: userProfile.first_name,
						userLastName: userProfile.last_name,
						userEmail: req.body.email,
						userPhoneCountryCode: userProfile.phone_code,
						userPhoneNumber: userProfile.phone,
						userProfileImage: userProfile.profile_image,
						userDOB: userProfile.dob,
						userSex: userProfile.sex,
						userAddress1: userProfile.address_line1,
						userAddress2: userProfile.address_line2,
						userAddressCity: userProfile.address_city,
						userAddressZip: userProfile.address_zip,
						userAddressState: userProfile.address_state,
						userAddressCountry: userProfile.address_country,
						userAddressCode: userProfile.address_zip,
						userTimezone: userProfile.timezone,
						isLabUser: userProfile.isLabUser
					},
					plansArray: plans,
				},
				error: {
					code: 200,
					msg: "success",
				},
			})
		} else {
			const response = await UserModel.create({
				email: req.body.email,
				user_type: "SOCIAL",
				email_verified: 1,
			})

			await response.save()

			const user: UserData = await UserModel.findOne({
				where: {
					email: req.body.email,
				},
			})

			token = generateToken(user.user_id)

			res.send({
				data: {
					firtTime: "1",
					access_token: token,
					userDetailsObject: {
						userID: user.user_id,
						stripeUserId: user.stripe_user_id,
						userEmail: req.body.email,
					},
					plans: [],
				},
				error: {
					code: 200,
					msg: "success",
				},
			})
		}
	} catch (error) {
		res.status(400).send({ error })
	}
}

export const otpAuth = async (req: Request, res: Response) => {
	try {
		if (req.body.otp) {
			const user = await UserModel.findOne({
				raw: true,
				where: {
					email: req.body.email,
					otp: req.body.otp,
					user_type: "OTP",
				},
			})

			if (!user) {
				return res.status(400).send({ msg: "Invalid Code" })
			}

			const userProfile = await UserProfileModel.findOne({
				raw: true,
				where: {
					user_id: user.user_id,
				},
			})

			if (!userProfile) {
				await new UserProfileModel({
					user_id: user.user_id,
					first_name: req.body.name || "",
				}).save()
			}

			let token = generateToken(user.user_id)

			return res.send({
				data: {
					access_token: token,
					userName: userProfile
						? `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`
						: req.body.name || "",
				},
			})
		} else {
			let userProfile: any = null

			const user = await UserModel.findOne({
				raw: true,
				where: {
					email: req.body.email,
				},
			})

			if (user && user.user_type !== "OTP") {
				return res.status(400).send({ message: "Email already registered with different method." })
			}

			const otp = Math.floor(Math.random() * 1000000)
				.toString()
				.padStart(6, "0")

			if (user) {
				await UserModel.update(
					{ otp, attempts: 0 },
					{
						where: { user_id: user.user_id },
					}
				)

				userProfile = await UserProfileModel.findOne({
					raw: true,
					where: {
						user_id: user.user_id,
					},
				})
			} else {
				const insert: any = {
					otp,
					email: req.body.email,
					user_type: "OTP",
				}

				await new UserModel(insert).save()
			}

			const mails = [{
				email: req.body.email,
				otp
			}]
			await sendAPIEmail(mails, EmailCondition.Otp)
		}
	} catch (err) {
		console.log(err)
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

export const getUserType = async (req: Request, res: Response) => {
	try {
		const user = await UserModel.findOne({
			raw: true,
			where: {
				email: req.query.email,
			},
		})

		if (user?.user_type) {
			if (user.password_hash) {
				return res.send({ userType: "PASSWORD" })
			}
			return res.send({ userType: user.user_type })
		}

		return res.send({ userType: null })
	} catch (err) {
		console.log(err)
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

export const userProfile = async (req: Request, res: Response) => {
	try {
	  const userId = req.body.payload.user_id
  
	  const updateData: any = {}

	  if(req.body.name !== undefined){		
		updateData.first_name = req.body.name ? req.body.name.split(/\s/)[0] : null
		updateData.last_name = req.body.name ? req.body.name.split(/\s/).slice(1).join(' ') : null
	  }

	  if(req.body.phoneNumber !== undefined){
		updateData.phone = req.body.phoneNumber || null
	  }

	  if(req.body.country !== undefined){
		updateData.address_country = req.body.country || null
	  }

	  if(req.body.gender !== undefined){		
		updateData.sex = req.body.gender || null
	  }

	  await UserProfileModel.update(updateData, {
		where: { user_id: userId },
	  })
  
	  res.send()
	} catch (err) {
	  console.log(err)
	  return res.status(500).json({
		msg: 'INTERNAL ERROR',
	  })
	}
  }

  export const verifyOTP = async (req: Request, res: Response) => {
	const userData = await UserModel.findOne({ where: { email: req.body.email }, raw: true })
	const otp = userData?.otp
	const attempts = userData?.attempts??0
	
	if (!userData) {
		res.send({ msg: "USER_NOT_FOUND" })
		return 
	}
	if (req.body.otp != otp && attempts == 2) {
		await UserModel.update(
			{ attempts: (attempts+1), otp: '0000' },
			{ where: { email: req.body.email } }
		)
		res.send({ msg: "INVALID_OTP" })
		return
	}
	if (req.body.otp != otp && attempts < 2) {
		await UserModel.update(
			{ attempts: (attempts+1) },
			{ where: { email: req.body.email } }
		)
		res.send({ msg: "INVALID_OTP" })
		return
	}
	if (req.body.otp == otp && attempts < 3) {
		await UserModel.update(
			{ attempts: 0, otp: '0000' },
			{ where: { email: req.body.email } }
		)
		res.send({ msg: "SUCCESS" })
	} else {
		res.send({ msg: "MAX_ATTEMPTS_REACHED" })
	}
}