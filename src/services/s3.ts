import AWS from "aws-sdk"
import config from "../config"
import { SpaceName, ACL, BucketNames } from "../types/interface"

const UploadFileToS3 = (
	spacesName: SpaceName,
	ACL: ACL,
	file: Buffer,
	userId: number,
	ext: string,
	ContentType: string
) => {
	const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? "")

	const s3 = new AWS.S3({
		endpoint: spacesEndpoint,
		accessKeyId: process.env.SPACES_KEY,
		secretAccessKey: process.env.SPACES_SECRET,
	})

	const fileName = `${userId}_${Date.now()}.${ext}`

	return new Promise((resolve, reject) => {
		s3.putObject({ Bucket: spacesName ?? "", Key: fileName, ACL, Body: file, ContentType }, (err, data: any) => {
			if (err) {
				reject(err)
			} else {
				data.Url = `https://${spacesName}.${process.env.SPACES_ENDPOINT}/${fileName}`
				resolve(data)
			}
		})
	})
}

const UploadFileToS3Generic = (
	bucket: SpaceName,
	ACL: ACL,
	file: Buffer,
	key: string,
	ContentType: string
) => {
	const spacesEndpoint = new AWS.Endpoint(config.SPACES_ENDPOINT ?? "")

	let options = {
		endpoint: spacesEndpoint,
		accessKeyId: config.DO_SPACE_KEY,
		secretAccessKey: config.DO_SPACE_SECRET,
	};
	// console.log(options)
	// console.log(bucket)
	// console.log(ACL)
	// console.log(key)
	// console.log(ContentType)
	const s3 = new AWS.S3(options)

	return new Promise((resolve, reject) => {
		s3.putObject({ Bucket: bucket ?? "", Key: key, ACL, Body: file, ContentType }, (err, data: any) => {
			if (err) {
				reject(err)
			} else {
				data.Url = `https://${bucket}.${config.SPACES_ENDPOINT}/${key}`
				resolve(data)
			}
		})
	})
}

const CopyS3Generic = (
	bucket: SpaceName,
	ACL: ACL,
	key: string,
	sourceBucket: SpaceName,
	sourceKey: string,
) => {
	const spacesEndpoint = new AWS.Endpoint(config.SPACES_ENDPOINT ?? "")

	let options = {
		endpoint: spacesEndpoint,
		accessKeyId: config.DO_SPACE_KEY,
		secretAccessKey: config.DO_SPACE_SECRET,
	};
	const s3 = new AWS.S3(options)

	return new Promise((resolve, reject) => {
		s3.copyObject({ Bucket: bucket ?? "", Key: key, ACL, CopySource: `${sourceBucket}/${sourceKey}`, }, (err, data: any) => {
			if (err) {
				reject(err)
			} else {
				data.Url = `https://${bucket}.${config.SPACES_ENDPOINT}/${key}`
				resolve(data)
			}
		})
	})
}
const DownloadFileFromS3 = (Bucket: BucketNames, url: string) => {
	const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? "")

	const s3 = new AWS.S3({
		endpoint: spacesEndpoint,
		accessKeyId: process.env.SPACES_KEY,
		secretAccessKey: process.env.SPACES_SECRET,
	})

	return new Promise((resolve, reject) => {
		const urlParts = url.split("/")
		s3.getObject({ Bucket: Bucket ?? "", Key: urlParts[urlParts.length - 1] ?? "" }, (err, data: any) => {
			if (err) {
				reject(err)
			} else {
				resolve(data?.Body)
			}
		})
	})
}

const DeleteFileFromS3 = (spacesName: string, fileName: string) => {
	const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? '')

	const s3 = new AWS.S3({
		endpoint: spacesEndpoint,
		accessKeyId: process.env.SPACES_KEY,
		secretAccessKey: process.env.SPACES_SECRET,
	})

	return new Promise((resolve, reject) => {
		s3.deleteObject({ Bucket: spacesName ?? '', Key: fileName ?? '' }, (err, data: any) => {
			if (err) {
				reject(err)
			} else {
				resolve(data?.Body)
			}
		})
	})
}

const GenerateSignedUrl = (Bucket: BucketNames, url: string, fileName: string) => {
	const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? "")

	const s3 = new AWS.S3({
		endpoint: spacesEndpoint,
		accessKeyId: process.env.SPACES_KEY,
		secretAccessKey: process.env.SPACES_SECRET,
	})

	return new Promise((resolve, reject) => {
		const urlParts = url.split("/")
		s3.getObject({ Bucket: Bucket ?? "", Key: urlParts[urlParts.length - 1] ?? "" }, (err, data: any) => {
			if (err) {
				reject(err)
			} else {
				s3.getSignedUrl("getObject", { Bucket: process.env.S3_BUCKET_NAME, Key: fileName }, (err, url) => {
					if (err) {
						reject(err)
					} else {
						resolve({ Url: url, Etag: data.ETag })
					}
				})
			}
		})
	})
}

const GenerateSignedUrlGeneric = (bucket: BucketNames, key: string) => {
	const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? "")

	const s3 = new AWS.S3({
		endpoint: spacesEndpoint,
		accessKeyId: config.DO_SPACE_KEY,
		secretAccessKey: config.DO_SPACE_SECRET,
	})

	return new Promise((resolve, reject) => {
		s3.getObject({ Bucket: bucket, Key: key }, (err, data: any) => {
			if (err) {
				reject(err)
			} else {
				s3.getSignedUrl("getObject", { Bucket: bucket, Key: key }, (err, url) => {
					if (err) {
						reject(err)
					} else {
						resolve({ Url: url, Etag: data.ETag })
					}
				})
			}
		})
	})
}
export {
	UploadFileToS3,
	UploadFileToS3Generic,
	DownloadFileFromS3,
	GenerateSignedUrl,
	GenerateSignedUrlGeneric,
	DeleteFileFromS3,
	CopyS3Generic
}

export default {}
