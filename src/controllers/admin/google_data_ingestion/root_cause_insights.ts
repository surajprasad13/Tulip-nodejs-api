import { Request, Response } from "express"
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet"
import RootCauseInsights from "../../../models/root_cause_insights"
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

async function ingestImage(groupId: number, imageId: string, rootCauseInsightId: number): Promise<string | null> {
	if (!groupId || !imageId || !rootCauseInsightId) {
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

			const data: any = await saveFile(`${groups[groupId]}/${rootCauseInsightId}.jpeg`, fileResized)

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
				Bucket: SpaceName.TulipRootCauseInsights,
				Key: fileName,
				ACL: ACL.public,
				Body: buffer,
				ContentType: "image/jpeg",
			},
			(err, data: any) => {
				if (err) {
					reject(err)
				} else {
					data.Url = `https://${SpaceName.TulipRootCauseInsights}.${process.env.SPACES_ENDPOINT}/${fileName}`
					resolve(data)
				}
			}
		)
	})
}

export const ingestRootCauseInsights = async (request: Request, response: Response) => {
	try {
		const resultStats: any = {}

		const doc = new GoogleSpreadsheet("1FME3iUu5fdHj0i9Z_4acCT_3CaN2VwuEoaEU_yMhuUU")

		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
			private_key: process.env.GOOGLE_PRIVATE_KEY || "",
		})

		await doc.loadInfo()

		const { counter, fails } = await migrateSheetToDB(doc.sheetsByIndex[2])

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

	await RootCauseInsights.destroy({
		where: {},
		truncate: true,
	})

	const rows = await sheet.getRows()
	for (const row of rows) {
		const id = +row["Id"] || null
		const group_id = +row["Plan"] || null
		const title = row["Title"] || null
		const description = row["Description"] || null
		const studies = row["Studies"] ? JSON.parse(row["Studies"]) : null
		const imageId = row["image_id"] || null

		if (id && group_id && title && description) {
			const insert: any = {
				id,
				group_id,
				title,
				description,
				studies,
			}

			const rootCauseInsight = await new RootCauseInsights(insert).save()

			if (imageId) {
				ingestImageAndUpdateDB(group_id, imageId, rootCauseInsight.id)
				await wait1Second()
			}

			counter++
		} else {
			fails.push({
				id,
				group_id,
				title,
				description,
				studies,
			})
		}
	}
	return { counter, fails }
}

async function ingestImageAndUpdateDB(id_group: number, imageId: string, rootCauseInsightId: number) {
	try {
		const imageUrl = await ingestImage(id_group, imageId, rootCauseInsightId)
		if (!imageUrl) {
			throw new Error("Image not found")
		}

		await RootCauseInsights.update({ image_url: imageUrl }, { where: { id: rootCauseInsightId } })
	} catch (err) {
		console.log(`Error ingesting image: ${imageId}`)
	}
}

async function wait1Second() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true)
		}, 1000)
	})
}
