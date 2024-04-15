import { JWT } from "google-auth-library"
import { google } from "googleapis"
import { ACL, SpaceName } from "../types/interface"
import AWS from "aws-sdk"
import sharp from "sharp"
import Drinks from "../models/masters/drinks"


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

export async function ingestDrinksImages() {
    console.log("ingestImages");
    
    try {

		const drinks = (await Drinks.findAll({
			raw: true,
		})||[]).filter((drink:any)=>!drink.image_url)

		for(const drink of drinks) {
			await ingestImageAndUpdateDB(drink.id, (drink.image_name??'').trim())
			await wait1Second()
		}
	} catch (error) {
		console.log(error)

		
	}

}


async function wait1Second() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true)
		}, 1000)
	})
}

async function ingestImageAndUpdateDB(id: number, imageFileName: string) {
	try {
		console.log(`Ingesting image: ${imageFileName} - ${id}`);
		
		const imageUrl = (await ingestImage(id, imageFileName)) || null

		if(!imageUrl) {
			console.log(`Image not found: ${imageFileName} - ${id}`);
			
		}
		else{
			console.log(`Image url: ${imageUrl}`);
		}
		
		await Drinks.update({ image_url: imageUrl }, { where: { id: id } })

		return imageUrl
	} catch (err) {
		console.log(`Error ingesting image: ${imageFileName} - ${id}`)
	}
}

async function ingestImage(
	id: number, imageFileName: string
): Promise<string | null> {
	if (!imageFileName) {
		return null
	}

	try {
		const file = await getFileFromGoogleDrive(imageFileName)

		if (file) {
			const fileResized = await sharp(file).resize(800).toBuffer()

			const data: any = await saveFile(`drinks/${id}_${imageFileName}`, fileResized)

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

