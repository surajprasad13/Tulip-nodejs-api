import { Request, Response } from "express"
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"
import { google } from "googleapis"
import { ACL, SpaceName } from "../types/interface"
import AWS from "aws-sdk"
import sharp from "sharp"
import TreatmentMaster from "../models/masters/treatment_master"


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

export async function ingestTreatmentImages() {
    console.log("ingestImages");
    
    try {
		const resultStats: any = {}

		const doc = new GoogleSpreadsheet("18gWEe5KZHV3DTgO_tllsVoTuWTToLXp98aqXHN9mqSY")

		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
			private_key: process.env.GOOGLE_PRIVATE_KEY || "",
		})

		await doc.loadInfo()

		const { counter, fails } = await migrateSheetToDB(doc.sheetsByIndex[0])

		resultStats.counter = counter
		resultStats.fails = fails

		console.log(resultStats);
        
	} catch (error) {
		console.log(error)

		
	}

}

async function migrateSheetToDB(sheet: GoogleSpreadsheetWorksheet) {
	const fails: Array<any> = []

	if (!sheet) {
		return { counter: null, fails: null }
	}
	let counter = 0


	const rows = await sheet.getRows()

	const notFound = []

	for (const row of rows) {
		const options: any = {}

		const treatment_id = (+row["treatment_id"]) || null
        const imageFileName = row["Image"] || null

		if (treatment_id && imageFileName) {
			if(!ingestImageAndUpdateDB(treatment_id, imageFileName)){
				notFound.push(imageFileName)
			}
			await wait1Second()

			counter++
		}
	}

	console.log('NOT FOUND');
	console.log(notFound);	
	
	return { counter, fails }
}

async function wait1Second() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true)
		}, 1000)
	})
}

async function ingestImageAndUpdateDB(treatment_id: number, imageFileName: string) {
	try {
		console.log(`Ingesting image: ${imageFileName} - ${treatment_id}`);
		
		const imageUrl = (await ingestImage(treatment_id, imageFileName)) || null

		if(!imageUrl) {
			console.log(`Image not found: ${imageFileName} - ${treatment_id}`);
			
		}
		else{
			console.log(`Image url: ${imageUrl}`);
		}
		
		await TreatmentMaster.update({ image_url: imageUrl }, { where: { treatment_id: treatment_id } })

		return imageUrl
	} catch (err) {
		console.log(`Error ingesting image: ${imageFileName} - ${treatment_id}`)
	}
}

async function ingestImage(
	treatment_id: number, imageFileName: string
): Promise<string | null> {
	if (!imageFileName) {
		return null
	}

	try {
		const file = await getFileFromGoogleDrive(imageFileName)

		if (file) {
			const fileResized = await sharp(file).resize(800).toBuffer()

			const data: any = await saveFile(`treatments/${treatment_id}_${imageFileName}`, fileResized)

			return data?.Url || null
		}
	} catch (err) {
		throw err
	}

	return null
}


async function getFileFromGoogleDrive(fileName: string): Promise<Buffer | null> {	

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

