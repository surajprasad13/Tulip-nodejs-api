import { Request, Response } from "express"
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet"
import Remedies from "../../../models/remedies"
import { JWT } from "google-auth-library"
import { google } from "googleapis"
import { ACL, SpaceName } from "../../../types/interface"
import AWS from "aws-sdk"
import sharp from "sharp"

const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? "")

const s3 = new AWS.S3({
	endpoint: spacesEndpoint,
	accessKeyId: process.env.SPACES_KEY,
	secretAccessKey: process.env.SPACES_SECRET,
})

const auth: any = new JWT({
	email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: process.env.GOOGLE_PRIVATE_KEY,
	scopes: ["https://www.googleapis.com/auth/drive"],
})

const service = google.drive({ version: "v3", auth })

async function ingestImage(
	groupId: number,
	remedyType: string,
	imageId: string,
	remedyId: number
): Promise<string | null> {
	if (!groupId || !remedyId || !remedyType || !imageId) {
		return null
	}

	const groups: any = {
		101: "sleep",
		102: "fatigue",
		103: "bs",
		104: "lg",
		105: "flg"
	}

	try {
		const file = await getFileFromGoogleDrive(imageId)

		if (file) {
			const fileResized = await sharp(file).resize(800).toBuffer()

			const data: any = await saveFile(`${groups[groupId]}/${remedyType}/${remedyId}.jpeg`, fileResized)

			return data?.Url || null
		}
	} catch (err) {
		throw err
	}

	return null
}

async function getFileFromGoogleDrive(imageId: string): Promise<Buffer | null> {
	const fileName = `${imageId}.jpeg`

	const res: any = await service.files.list({
		q: `name='${fileName}'`,
		fields: "nextPageToken, files(id, name)",
		spaces: "drive",
	})

	if (!res?.data?.files?.length) {
		return null
	}

	const file = await service.files.get(
		{
			fileId: res.data.files[0].id ?? "",
			alt: "media",
		},
		{ responseType: "stream" }
	)

	if (file?.status === 200) {
		return await fromStreamToBuffer(file.data)
	}

	return null
}

function fromStreamToBuffer(stream: any): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: any = []
		stream.on("data", (chunk: any) => {
			chunks.push(chunk)
		})
		stream.on("end", () => {
			resolve(Buffer.concat(chunks))
		})
		stream.on("error", reject)
	})
}

function saveFile(fileName: string, buffer: Buffer) {
	return new Promise((resolve, reject) => {
		s3.putObject(
			{
				Bucket: SpaceName.TulipRemedies,
				Key: fileName,
				ACL: ACL.public,
				Body: buffer,
				ContentType: "image/jpeg",
			},
			(err, data: any) => {
				if (err) {
					reject(err)
				} else {
					data.Url = `https://${SpaceName.TulipRemedies}.${process.env.SPACES_ENDPOINT}/${fileName}`
					resolve(data)
				}
			}
		)
	})
}

export const ingestRemedyMaster = async (request: Request, response: Response) => {
	try {
		const resultStats: any = {}

		const doc = new GoogleSpreadsheet("1fYPNT2pTKNILdsyrzQi4FvrSXWLhlSuQd2E-esHAIjg")

		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
			private_key: process.env.GOOGLE_PRIVATE_KEY || "",
		})

		await doc.loadInfo()

		const { counter, fails } = await migrateSheetToDB(doc.sheetsByIndex[0])

		resultStats.counter = counter
		resultStats.fails = fails

		response.send(resultStats)
	} catch (error) {
		console.log(error)

		response.status(500).send({ message: "INTERNAL ERROR" })
	}
}

async function migrateSheetToDB(sheet: GoogleSpreadsheetWorksheet) {
	const fails: Array<any> = []

	if (!sheet) {
		return { counter: null, fails: null }
	}
	let counter = 0
	await Remedies.destroy({
		where: {},
		truncate: true,
	})

	const rows = await sheet.getRows()
	for (const row of rows) {
		const options: any = {}

		const id_group = +row["survey_id"] ?? null
		const remedy_type = strClean(row["remedy_type"])
		const name = strClean(row["Name"])
		const remedy_id = +row["remedy_id"] ?? null
		const brand = strClean(row["Brand"])
		const imageId = strClean(row["image_id"])
		const allergy_id = strClean(row["allergy_id"])
		const link_coupon_code = strClean(row["Link/Coupon Code"])
		options.supplement_summary_page = strClean(row["supplement_summary_page"])
		options.descriptions = strClean(row["Descriptions"])
		options.mad_libs_supplements_why = strClean(row["mad_libs_supplements_why"])
		options.suggested_usage = strClean(row["Suggested Usage"])
		options.subtitle = strClean(row["Subtitle"])
		options.bullet_points = strClean(row["Bullet Points"])
		options.recipe = strClean(row["Recipe"])
		options.reference_links = strClean(row["Reference links"])
		options.medication_interaction_ids = strClean(row["medication_interaction_ids"])
		options.ingredient_breakdown_allergies = strClean(row["INGREDIENT BREAKDOWN FOR ALLERGIES"])
		options.herb_nutrient = strClean(row["Herb (H) or Nutrient (N)"])
		options.learn_more = strClean(row["Learn More"])
		options.if_no_answers = strClean(row["if_no_answers"])
		options.warming_cooling_neutral = strClean(row["(W)arming or (C)ooling or (N)eutral"])
		options.ingredients = strClean(row["Rough Ingredient List"])
		options.reactions = strClean(row["Reactions"])
		options.minor = strClean(row["Minor"])
		options.special_precautions = strClean(row["Special Precautions"])
		options.single_blend = strClean(row["Single (S) or Blend (B)"])
		options.suggested_dose = strClean(row["suggested_dose"])
		options.video_id = strClean(row["video_id"])
		
		options.fundamental_nutrition_core_essentials_additional_support = strClean(
			row["Fundamental Nutrition (F) or Core Essentials (C) or Additional Support(A)"]
		)

		if (id_group && remedy_type && name && remedy_id) {
			const insert: any = {
				id_group,
				remedy_type,
				name,
				remedy_id,
				brand,
				link_coupon_code,
				options,
				allergy_id,
			}

			const remedy = await new Remedies(insert).save()

			if (imageId) {
				ingestImageAndUpdateDB(id_group, remedy_type, imageId, remedy.id)
				await wait1Second()
			}

			counter++
		} else {
			fails.push({
				id_group,
				remedy_type,
				name,
				remedy_id,
				brand,
				link_coupon_code,
				options,
			})
		}
	}
	return { counter, fails }
}

async function wait1Second() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true)
		}, 1000)
	})
}

async function ingestImageAndUpdateDB(id_group: number, remedy_type: string, imageId: string, remedyId: number) {
	try {
		const imageUrl = await ingestImage(id_group, remedy_type, imageId, remedyId)
		if (!imageUrl) {
			throw new Error("Image not found")
		}

		await Remedies.update({ image_url: imageUrl }, { where: { id: remedyId } })
	} catch (err) {
		console.log(`Error ingesting image: ${imageId}`)
	}
}

function strClean(data: string) {
	if (!data) {
		return null
	}

	if (data.replace(/\s/g, "").length) {
		return data
	}

	return null
}
