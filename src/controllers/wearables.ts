import axios from "axios"
import { raw, Request, Response } from "express"

import FormData from "form-data"
import UserWearablesModel from "../models/user_wearables"
import UserWearableDataModel from "../models/user_wearable_data"
import UserWearableData2Model from "../models/user_wearable_data2"
import { getLoggedInUserId, code_verifier, code_challenge, base64Encode, formatDate } from "../utils"
import { stringify } from "querystring"
import firebase from "../config/firebase"
import UserWearableAnalysis from "../models/user_wearables_analysis"
import { TongueAnalysis_Data_KeyFolder, userDataBucket, UserDataFolder, userDataKey, userWearableDataKey, WearableDevice } from "../services/user-data"
import { GenerateSignedUrlGeneric, UploadFileToS3Generic } from "../services/s3"
import { ACL, BucketNames, SpaceName } from "../types/interface"
import { DoGetObject } from "../services/gcp"

const ouraringClientId = "VHXGRJ7XNK64Q4BL"
const ouraringClientSecret = "IHGED6QYJFB5DHJNQ3YXSCHGO4VWI5HF"
const ouraringRedirectURI = "minitulip://wearable"
const fitbitClientId = "238QLZ"

const wearableNames: any = { 1: "Apple", 2: "Fit Bit", 3: "Oura" }
const wearableIcons: any = {
	1: "https://mobile-app-assets.fra1.digitaloceanspaces.com/apple_icon.png",
	2: "https://mobile-app-assets.fra1.digitaloceanspaces.com/fitbit_icon.png",
	3: "https://mobile-app-assets.fra1.digitaloceanspaces.com/oura_icon.png",
}

export const deleteWearable = async (req: Request, res: Response) => {
	const userId = getLoggedInUserId(req)
	const wearableId = req.params.id

	try {
		const update = {
			wearable_status: "NOT-CONNECTED",
			token: null,
			date_updated: new Date(),
		}

		await UserWearablesModel.update(update, { where: { user_id: userId, wearable_id: wearableId } })

		res.status(200).send()
	} catch (err) {
		console.log(err)
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

export const getWearablesProviders = async (req: Request, res: Response) => {
	const jwt = (req.headers.authorization ?? "").replace("Bearer", "").trim()
	const userId = getLoggedInUserId(req)

	const userWearable = await UserWearablesModel.findOne({
		raw: true,
		where: { user_id: userId, wearable_id: 2 },
	})

	if (!userWearable) {
		const insert = {
			user_id: userId,
			wearable_id: 2,
			wearable_status: "NOT-CONNECTED",
			fitbit_base_64_encode: base64Encode,
			fitbit_code_verifier: code_verifier,
			fitbit_code_challenge: code_challenge,
			date_created: new Date(),
			date_updated: null,
		}

		const userWearables = new UserWearablesModel(insert)
		await userWearables.save()
	} else {
		const update = {
			fitbit_base_64_encode: base64Encode,
			fitbit_code_verifier: code_verifier,
			fitbit_code_challenge: code_challenge,
			date_updated: null,
		}

		await UserWearablesModel.update(update, { where: { user_id: userId, wearable_id: 2 } })
	}

	try {
		const wearablesProviders = [
			{
				wearable_id: 1,
				name: wearableNames[1],
				authUrl: "",
				icon: wearableIcons[1],
			},
			{
				wearable_id: 2,
				name: wearableNames[2],
				authUrl: `https://www.fitbit.com/oauth2/authorize?client_id=${fitbitClientId}&response_type=code&scope=activity%20heartrate%20location%20nutrition%20oxygen_saturation%20profile%20respiratory_rate%20settings%20sleep%20social%20temperature%20weight&state&code_challenge=${code_challenge}&code_challenge_method=S256`,
				icon: wearableIcons[2],
			},
			{
				wearable_id: 3,
				name: wearableNames[3],
				authUrl: `https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=${ouraringClientId}&redirect_uri=${encodeURIComponent(
					ouraringRedirectURI
				)}&state=${jwt}`,
				icon: wearableIcons[3],
			},
		]

		res.json(wearablesProviders)
	} catch (err) {
		console.log(err)
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

export const getStatus = async (req: Request, res: Response) => {
	try {
		const userId = getLoggedInUserId(req)

		const userWearables =
			(await UserWearablesModel.findAll({
				raw: true,
				where: { user_id: userId },
				order: [["date_updated", "DESC"]],
			})) || []

		return res.json(
			userWearables.map((uw: any) => ({
				wearableId: uw.wearable_id,
				name: wearableNames[uw.wearable_id],
				icon: wearableIcons[uw.wearable_id],
				status: uw.wearable_status,
			}))
		)
	} catch (err) {
		console.log(err)
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

export const postCode = async (req: Request, res: Response) => {
	try {
		const wearableId = req.body.wearableId
		const code = req.body.code
		const userId = getLoggedInUserId(req)

		if (wearableId === 3) {
			const grantType = "authorization_code"
			const url = "https://cloud.ouraring.com/oauth/token"

			const formData = new FormData()
			formData.append("grant_type", grantType)
			formData.append("code", code)
			formData.append("client_id", ouraringClientId)
			formData.append("client_secret", ouraringClientSecret)
			formData.append("redirect_uri", ouraringRedirectURI)

			const d = await axios.post(url, formData)

			if (d?.data && d?.data?.refresh_token) {
				if (
					await UserWearablesModel.findOne({ raw: true, where: { user_id: userId, wearable_id: wearableId } })
				) {
					const update = {
						wearable_status: "CONNECTED",
						token: d.data.refresh_token,
						date_updated: new Date(),
					}

					await UserWearablesModel.update(update, { where: { user_id: userId, wearable_id: wearableId } })
				} else {
					const insert = {
						user_id: userId,
						wearable_id: 3,
						wearable_status: "CONNECTED",
						token: d.data.refresh_token,
						date_created: new Date(),
						date_updated: new Date(),
					}

					const userWearables = new UserWearablesModel(insert)
					await userWearables.save()
				}

				return res.status(200).send()
			}
		} else {
			if (wearableId === 2) {
				const userWearable = await UserWearablesModel.findOne({
					raw: true,
					where: { user_id: userId, wearable_id: 2 },
				})

				if (!userWearable || !userWearable.fitbit_base_64_encode || !userWearable.fitbit_code_verifier) {
					return res.status(400).json({
						msg: "fitbit_base_64_encode or fitbit_code_verifier is missing",
					})
				}

				const grantType = "authorization_code"
				const url = "https://api.fitbit.com/oauth2/token"

				const params = stringify({
					grant_type: grantType,
					code,
					client_id: fitbitClientId,
					code_verifier: userWearable.fitbit_code_verifier,
				})

				const d = await axios.post(url, params, {
					headers: { Authorization: `Basic ${userWearable.fitbit_base_64_encode}` },
				})

				if (d?.data && d?.data?.refresh_token && d?.data?.user_id) {
					const update = {
						wearable_status: "CONNECTED",
						token: d.data.refresh_token,
						fitbit_user_id: d.data.user_id,
						date_updated: new Date(),
					}

					await UserWearablesModel.update(update, { where: { user_id: userId, wearable_id: wearableId } })

					return res.status(200).send()
				}
			} else {
				return res.status(400).json({
					msg: "INVALID WEARABLE ID",
				})
			}
		}

		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	} catch (err: any) {
		console.log(err)
		console.log(err?.response?.data)

		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

export const getData = async (req: Request, res: Response) => {
	try {
		const data: any = {}
		const userWearables = await UserWearablesModel.findAll({ raw: true, where: { wearable_status: "CONNECTED" } })

		for (const userWearable of userWearables) {
			if (!data[userWearable.user_id]) {
				data[userWearable.user_id] = {}
			}

			const provider =
				userWearable.wearable_id === 1 ? "apple" : userWearable.wearable_id === 2 ? "fitbit" : "oura"

			if (!data[userWearable.user_id][provider]) {
				data[userWearable.user_id][provider] = {}
			}

			data[userWearable.user_id][provider] = {
				...userWearable.user_info,
				data: {},
			}

			const userWearableData = await UserWearableDataModel.findAll({
				raw: true,
				where: { user_wearables_id: userWearable.user_wearables_id },
				order: [["user_wearable_data_id", "DESC"]],
			})

			if (userWearableData && userWearableData.length) {
				data[userWearable.user_id][provider].timezone = getTimeZone(userWearable, userWearableData)

				for (const d of userWearableData) {
					data[userWearable.user_id][provider].data[d.date] = {
						sleep: d.sleep,
						activity: d.activity,
						readiness: d.readiness,
						breathing: d.breathing,
						heart: d.heart,
						spo2: d.spo2,
						tempSkin: d.temp_skin,
						tempCore: d.temp_core,
					}
				}
			}
		}

		res.send(data)
	} catch (err: any) {
		console.log(err)
		console.log(err?.data?.errors)
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

function getTimeZone(userWearable: any, userWearableData: Array<any>) {
	if (userWearable.wearable_id === 2) {
		if (userWearable?.user_info?.timezone) {
			return getTimezoneOffset(userWearable?.user_info?.timezone)
		}
	}

	if (userWearable.wearable_id === 3) {
		if (userWearableData && userWearableData.length) {
			return (
				(
					userWearableData.find(
						(d: any) => d?.sleep?.timezone !== null && d?.sleep?.timezone !== undefined
					) ?? {}
				).sleep?.timezone / 60
			)
		}
	}

	return null
}

function getTimezoneOffset(timeZone: string, date = new Date()) {
	const tz = date.toLocaleString("en", { timeZone, timeStyle: "long" }).split(" ").slice(-1)[0]
	const dateString = date.toString()
	const offset = Date.parse(`${dateString} UTC`) - Date.parse(`${dateString} ${tz}`)

	return offset / 1000 / 60 / 60
}

export async function updateWearableData(start?: string | null | undefined, end?: string | null | undefined) {
	console.log(`${new Date().toISOString()} - updateWearableData - START`)

	await updateOuraRingWearableData(start, end)
	await updateFitBitWearableData(start, end)

	console.log(`${new Date().toISOString()} - updateWearableData - DONE`)
}

async function updateFitBitWearableData(start?: string | null | undefined, end?: string | null | undefined) {
	const fitbitUsersWearables = await UserWearablesModel.findAll({
		raw: true,
		where: { wearable_id: 2, wearable_status: "CONNECTED" },
	})

	console.log(
		`${new Date().toISOString()} - updateFitBitWearableData - fitbitUsersWearables: ${fitbitUsersWearables.length}`
	)

	for (const user of fitbitUsersWearables) {
		if (!start && !end) {
			const data = await UserWearableDataModel.findAll({
				raw: true,
				where: { user_wearables_id: user.user_wearables_id },
			})

			if (data && data.length < 30) {
				const startDt = new Date()
				startDt.setDate(startDt.getDate() - 60)

				const endDt = new Date()
				endDt.setDate(endDt.getDate() - 40)

				await updateFitBitWearableDataPerUser(user, formatDate(startDt), formatDate(endDt))

				startDt.setDate(startDt.getDate() + 20)
				endDt.setDate(endDt.getDate() + 20)

				await updateFitBitWearableDataPerUser(user, formatDate(startDt), formatDate(endDt))

				startDt.setDate(startDt.getDate() + 20)
				endDt.setDate(endDt.getDate() + 20)

				await updateFitBitWearableDataPerUser(user, formatDate(startDt), formatDate(endDt))
			} else {
				await updateFitBitWearableDataPerUser(user)
			}
		} else {
			await updateFitBitWearableDataPerUser(user, start, end)
		}
	}
}

async function updateFitBitWearableDataPerUser(
	user: any,
	start?: string | null | undefined,
	end?: string | null | undefined
) {
	const grantType = "refresh_token"
	const url = "https://api.fitbit.com/oauth2/token"

	const params = stringify({
		grant_type: grantType,
		refresh_token: user.token,
	})

	let d
	try {
		d = await axios.post(url, params, {
			headers: { Authorization: `Basic ${user.fitbit_base_64_encode}` },
		})
	} catch (err) {}

	if (d?.data && d?.data?.access_token && d?.data?.refresh_token && d?.data?.user_id) {
		const accessToken = d.data.access_token

		const userInfo = await getFitbitUserInfo(accessToken, d.data.user_id)

		const update = {
			token: d.data.refresh_token,
			fitbit_user_id: d.data.user_id,
			user_info: userInfo,
			date_updated: new Date(),
		}

		await UserWearablesModel.update(update, { where: { user_wearables_id: user.user_wearables_id } })

		const breathing = await getFitbitData(accessToken, d.data.user_id, "br", null, start, end)

		const heart = await getFitbitData(accessToken, d.data.user_id, "activities", "heart", start, end)

		const sleep = await getFitbitData(accessToken, d.data.user_id, "sleep", null, start, end)

		const spo2 = await getFitbitData(accessToken, d.data.user_id, "spo2", null, start, end)

		const tempSkin = await getFitbitData(accessToken, d.data.user_id, "temp", "skin", start, end)

		const tempCore = await getFitbitData(accessToken, d.data.user_id, "temp", "core", start, end)

		const activity = await getFitbitActivitySummary(accessToken, d.data.user_id, start, end)

		const mergedData = merge({ breathing, heart, sleep, spo2, tempSkin, tempCore, activity })

		await saveMergedData(mergedData, user.user_wearables_id, user.user_id, user.wearable_id)
	} else {
		await UserWearablesModel.update(
			{ token: null, wearable_status: "NOT-CONNECTED", date_updated: new Date() },
			{
				where: {
					user_wearables_id: user.user_wearables_id,
				},
			}
		)
	}
}

async function updateOuraRingWearableData(start?: string | null | undefined, end?: string | null | undefined) {
	const ouraUsersWearables = await UserWearablesModel.findAll({
		raw: true,
		where: { wearable_id: 3, wearable_status: "CONNECTED" },
	})

	console.log(
		`${new Date().toISOString()} - updateOuraRingWearableData - ouraUsersWearables: ${ouraUsersWearables.length}`
	)

	for (const user of ouraUsersWearables) {
		if (!start && !end) {
			const data = await UserWearableDataModel.findAll({
				raw: true,
				where: { user_wearables_id: user.user_wearables_id },
			})

			if (data && data.length < 30) {
				const date = new Date()
				date.setDate(date.getDate() - 60)
				start = formatDate(date)
				end = formatDate(new Date())
			}
		}

		const grantType = "refresh_token"
		const url = "https://cloud.ouraring.com/oauth/token"

		const formData = new FormData()
		formData.append("grant_type", grantType)
		formData.append("refresh_token", user.token)
		formData.append("client_id", ouraringClientId)
		formData.append("client_secret", ouraringClientSecret)

		let d
		try {
			d = await axios.post(url, formData)
		} catch (err) {}

		if (d?.data?.access_token && d?.data?.refresh_token) {
			await UserWearablesModel.update(
				{ token: d?.data?.refresh_token, date_updated: new Date() },
				{
					where: { user_wearables_id: user.user_wearables_id },
				}
			)

			const accessToken = d?.data?.access_token

			await updateUserInfo(accessToken, user.user_wearables_id)

			const readiness = await getOuraringData(accessToken, "readiness", start, end)
			const sleep = await getOuraringData(accessToken, "sleep", start, end)
			const activity = await getOuraringData(accessToken, "activity", start, end)

			const mergedData = merge({ readiness, sleep, activity })

			await saveMergedData(mergedData, user.user_wearables_id, user.user_id, user.wearable_id)
		} else {
			await UserWearablesModel.update(
				{ token: null, wearable_status: "NOT-CONNECTED", date_updated: new Date() },
				{
					where: {
						user_wearables_id: user.user_wearables_id,
					},
				}
			)
		}
	}
}

export const updateData = async (req: Request, res: Response) => {
	try {
		await updateWearableData(req.body.start, req.body.end)
		res.send()
	} catch (err: any) {
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

async function saveMergedData(mergedData: any, userWearablesId: number, userId: number, wearablesId: number) {
	const dates = Object.keys(mergedData)

	for (const date of dates) {
		const data = mergedData[date]

		const upsert = {
			user_wearables_id: userWearablesId,
			date: date,
			sleep: data?.sleep ?? null,
			activity: data?.activity ?? null,
			readiness: data?.readiness ?? null,
			breathing: data?.breathing ?? null,
			heart: data?.heart ?? null,
			spo2: data?.spo2 ?? null,
			temp_skin: data?.tempSkin ?? null,
			temp_core: data?.tempCore ?? null,
		}

		if (
			await UserWearableDataModel.findOne({
				raw: true,
				where: { user_wearables_id: userWearablesId, date: date },
			})
		) {
			await UserWearableDataModel.update(upsert, { where: { user_wearables_id: userWearablesId, date: date } })
		} else {
			const userWearables = new UserWearableDataModel(upsert)
			await userWearables.save()
		}

		await firebaseSave(upsert, wearablesId, userId, date)
	}
}

async function firebaseSave(data: any, wearablesId: number, userId: number, date: string) {
	const wearableName =
		wearablesId === 1 ? "apple" : wearablesId === 2 ? "fitbit" : wearablesId === 3 ? "oura" : "NULL"
	await firebase.database().ref("wearables-data").child(userId.toString()).child(wearableName).child(date).set(data)
}

function merge({ readiness, sleep, activity, breathing, heart, spo2, tempSkin, tempCore }: any) {
	const mergedData: any = {}

	const dates = [
		Object.keys(readiness || {}),
		Object.keys(sleep || {}),
		Object.keys(activity || {}),
		Object.keys(breathing || {}),
		Object.keys(heart || {}),
		Object.keys(spo2 || {}),
		Object.keys(tempSkin || {}),
		Object.keys(tempCore || {}),
	].sort((a, b) => b.length - a.length)[0]

	for (const date of dates) {
		mergedData[date] = {
			readiness: (readiness ?? {})[date] ?? null,
			sleep: (sleep ?? {})[date] ?? null,
			activity: (activity ?? {})[date] ?? null,
			breathing: (breathing ?? {})[date] ?? null,
			heart: (heart ?? {})[date] ?? null,
			spo2: (spo2 ?? {})[date] ?? null,
			tempSkin: (tempSkin ?? {})[date] ?? null,
			tempCore: (tempCore ?? {})[date] ?? null,
		}
	}

	return mergedData
}

async function updateUserInfo(token: string, userWearablesId: number) {
	const url = "https://api.ouraring.com/v1/userinfo"

	const d = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })

	if (d?.data) {
		await UserWearablesModel.update(
			{ user_info: d.data, date_updated: new Date() },
			{
				where: { user_wearables_id: userWearablesId },
			}
		)
	}
}

async function getOuraringData(
	token: string,
	dataType: string,
	start?: string | null | undefined,
	end?: string | null | undefined
) {
	const url =
		start && end
			? `https://api.ouraring.com/v1/${dataType}?start=${start}&end=${end}`
			: `https://api.ouraring.com/v1/${dataType}`

	const d = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })

	if (d?.data && d?.data[dataType]) {
		return d.data[dataType].reduce((acc: any, curr: any) => {
			if (curr?.summary_date) {
				acc[curr?.summary_date] = curr
			}

			return acc
		}, {})
	}
}

async function getFitbitData(
	token: string,
	userId: string,
	dataType: string,
	resourcePath?: string | null | undefined,
	start?: string | null | undefined,
	end?: string | null | undefined
) {
	try {
		if (!start) {
			const d = new Date()
			d.setDate(d.getDate() - 1)

			start = formatDate(d)
		}

		if (!end) {
			const d = new Date()

			end = formatDate(d)
		}

		if (resourcePath) {
			resourcePath = `${resourcePath}/`
		} else {
			resourcePath = ""
		}
		const url = `https://api.fitbit.com/1/user/${userId}/${dataType}/${resourcePath}date/${start}/${end}.json `

		const d = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })

		let key = dataType && resourcePath ? `${dataType}-${resourcePath.replace(/\//g, "")}` : dataType

		if (dataType === "temp" && resourcePath === "skin/") {
			key = "tempSkin"
		}

		if (dataType === "temp" && resourcePath === "core/") {
			key = "tempCore"
		}

		let data = []

		if (d?.data && d?.data[key]) {
			data = d.data[key]
		} else {
			if (d?.data?.length) {
				data = d.data
			}
		}

		if (data) {
			return data.reduce((acc: any, curr: any) => {
				if (key === "sleep") {
					if (curr?.dateOfSleep) {
						acc[curr?.dateOfSleep] = curr
					}
				} else {
					if (curr?.dateTime) {
						acc[curr?.dateTime] = curr
					}
				}

				return acc
			}, {})
		}
	} catch (err: any) {
		console.log(err)
		console.log(err?.response?.data)
		return {}
	}
}

async function getFitbitActivitySummary(
	token: string,
	userId: string,
	start?: string | null | undefined,
	end?: string | null | undefined
) {
	try {
		const result: any = {}

		if (!start) {
			const d = new Date()
			d.setDate(d.getDate() - 1)

			start = formatDate(d)
		}
		if (!end) {
			const d = new Date()

			end = formatDate(d)
		}

		const startDate = new Date(`${start}T00:00:00`)
		const endDate = new Date(`${end}T00:00:00`)

		while (startDate <= endDate) {
			const dateFormated = formatDate(startDate)

			const url = `https://api.fitbit.com/1/user/${userId}/activities/date/${dateFormated}.json`

			const d = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })

			if (d?.data) {
				result[dateFormated] = d.data
			}

			startDate.setDate(startDate.getDate() + 1)
		}

		return result
	} catch (err: any) {
		console.log(err)
		console.log(err?.response?.data)
		return {}
	}
}

async function getFitbitUserInfo(token: string, userId: string) {
	const url = `https://api.fitbit.com/1/user/${userId}/profile.json`

	const d = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })

	return d?.data?.user || null
}

export const postWearableAnalysis = async (req: Request, res: Response) => {
	try {
		const data = JSON.parse(req.body.data)
		const id_user = data[0].userId

		if (!id_user) {
			res.status(404).json({
				msg: `User ID is mandatory inside JSON string`,
			})
		} else {
			const insert = {
				user_id: id_user,
				data: data,
			}
			const wearableAnalysis = new UserWearableAnalysis(insert)
			await wearableAnalysis.save()
			res.json(wearableAnalysis)
		}
	} catch (err: any) {
		console.log(err)
		console.log(err?.response?.data?.errors)
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

export const getWearableAnalysis = async (req: Request, res: Response) => {
	try {
		const id_user = req.params.id
		const wearable = await UserWearableAnalysis.findAll({
			where: {
				user_id: id_user,
			},
		})
		if (wearable && wearable.length > 0) {
			res.json(wearable)
		} else {
			res.status(404).json({
				msg: `Wearable analysis not found`,
			})
		}
	} catch (err: any) {
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

export const insertWearableDataAppleWatch = async (req: Request, res: Response) => {
	try {
		console.log(`${new Date().toISOString()} - updateWearableData - START`)

		let start = req.body.start
		let end = req.body.end
		let date_request_start = req.body.date_request_start
		let date_request_end = req.body.date_request_end
		let raw_data = req.body.raw_data
		let wearable_id = req.body.wearable_id
		const user_id = getLoggedInUserId(req)

		const wearableDevice = await UserWearablesModel.findOne({
			raw: true,
			where: { wearable_id: wearable_id, wearable_status: "CONNECTED", user_id: user_id },
		})
		if (!wearableDevice) {
			return res.status(500).json({
				msg: "Wearable device not found.",
			})
		}
		const insert = {
			user_id: wearableDevice.user_id,
			wearable_id: wearable_id,
			date_request_start: date_request_start,
			date_request_end: date_request_end,
			raw_data: raw_data,
		}

		const userWearables = new UserWearableData2Model(insert)
		await userWearables.save()

		console.log(`${new Date().toISOString()} - updateWearableData - DONE`)

		res.send()
	} catch (err: any) {
		console.log(err)
		console.log(err?.response?.data?.errors)
		return res.status(500).json({
			msg: err,
		})
	}
}

export const postAppleHealthData = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id

		const wearable_id = req.query.wearable_id as WearableDevice
		var t = new Date();
		let filename = `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}-${t.getHours()}-${t.getMinutes()}-${t.getSeconds()}.health.${wearable_id}.raw.json`;
		// let folder = `dt=${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
	
		if (req.file) {
			let raw_data = req.file.buffer
			const imageBinary = raw_data
	
			try {
				const key = `${userWearableDataKey(user_id, wearable_id)}/${filename}`;
				await UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `application/json`);

				const key2 = `${userWearableDataKey(user_id, wearable_id)}/latest.health.${wearable_id}.raw.json`;
				await UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key2, `application/json`);

				res.status(200).send();
			} catch (error) {
				res.status(400).send({ error })
			}
		} else {
			res.status(500).send({ error: "file is missing" })
		}
	} catch (error) {
		console.log(error);
		res.status(500).send({ error: error })
	}		
}


export const getWearableAnalysis2 = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id

		const wearable_id = (WearableDevice.Apple) as WearableDevice
		var t = new Date();
		let filename = `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}-${t.getHours()}-${t.getMinutes()}-${t.getSeconds()}.health.${wearable_id}.raw.json`;
		// let folder = `dt=${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
		var analysis = {};

		try {
			var bucket = 'tulip-user-data';
			const key2 = `${userWearableDataKey(user_id, wearable_id)}/latest.health.${wearable_id}.raw.json`;
			var doObject = await DoGetObject(bucket, key2);
			var okk = await doObject?.Body?.transformToString();
			var content = JSON.parse(okk as string);
		}
		catch (error) {
			console.log(error)
			return res.status(200).send({ analysis: { isDataUploaded: false } })
		}

		// Blue box
		var blueBox = {
			sleepPattern: "regular",
			sleepSoftStarts: "11:00 AM",
			sleepDeepStarts: "11:00 AM",
			sleepDeepLength: "3"
		};
		var sleep = {
			sleepPattern: "regular",
			sleepSoftStarts: "11:00 AM",
			sleepDeepStarts: "11:00 AM",
			sleepDeepLength: "3",
			sleepHRV: "72",
			sleepHRVat: "3:00 AM",
			sleepHrvPattern: "average",
			sleepHrvPatternAge: "45"
		}

		// 30-Day heart, activity & sleep trends
		var analysis30days = {
			trendsHeartRate: "85",
			trendsRespirationRate: "85",
			trendsActivity: "85",
			trendsHRV: "60",
			trendsEnergyExpenditure: "85",
			trendsSleepDailyAverage: "6"
		}

		// Your sleep report
		var series = [];
		for (var i = 0; i < 50; i++) {
			series.push({
				"name": new Date(Date.now() + 1000 * 1000 * 1 * i),
				"value": parseInt(String(80 + Math.random() * 20))
			})
		}
		var timeseries = series;

		// Sleep and stress assessment
		var sleepAndStress = {
			sleepAndStressAssessmentHRV: 60,
			sleepAndStressAssessmentHRVnormal: 65,
			sleepAndStressAssessmentHR: 85,
			sleepAndStressAssessmentHRnormal: 75,
			sleepAndStressAssessmentHRpattern: "average",
			sleepAndStressAnalysis: "feeling stressed and tired with reduced recovery and resilience"
		}

		analysis = {
			blueBox,
			sleep,
			analysis30days,
			timeseries,
			sleepAndStress,
			isDataUploaded: true
		}

		res.status(200).send({ analysis })
	} catch (error) {
		console.log(error);
		res.status(500).send({ error: error })
	}
}

