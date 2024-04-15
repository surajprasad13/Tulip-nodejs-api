import { Request, Response } from "express"
import AdminUserModel from "../../../models/admin/admin-user"
import AWS from "aws-sdk"

export const getDoctorProfileImage = async (req: Request, res: Response) => {
	try {
		const doctorId = parseInt(req.params.id ?? "0")

		if (!doctorId) {
			return res.status(404).json({
				msg: "Unable to get user id.",
			})
		}

		const profileImageURL = (
			await AdminUserModel.findOne({
				raw: true,
				where: {
					id: doctorId,
				},
			})
		)?.profile_image

		if (!profileImageURL) {
			return res.status(404).json({
				msg: "Unable to get profile image URL.",
			})
		}

		const file = await downloadFileFromS3(profileImageURL)

		if (!file) {
			return res.status(404).json({
				msg: "File not find.",
			})
		}

		const profileImageURLParts = profileImageURL.split("/")

		res.setHeader(
			"Content-disposition",
			"attachment; filename=" + profileImageURLParts[profileImageURLParts.length - 1]
		)
		res.send(file)
	} catch (err) {
		console.log(err)
		return res.status(500).json({
			msg: "INTERNAL ERROR",
		})
	}
}

const downloadFileFromS3 = (url: string) => {
	const spacesName = "doctor-profile"

	const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? "")
	const s3 = new AWS.S3({
		endpoint: spacesEndpoint,
		accessKeyId: process.env.SPACES_KEY,
		secretAccessKey: process.env.SPACES_SECRET,
	})

	//   const contentType = mime.contentType(filePath)
	//   console.log('contentType', contentType)

	//   const ext = mime.extensions[contentType][0]
	return new Promise((resolve, reject) => {
		const urlParts = url.split("/")
		s3.getObject({ Bucket: spacesName ?? "", Key: urlParts[urlParts.length - 1] ?? "" }, (err, data: any) => {
			if (err) {
				reject(err)
			} else {
				resolve(data?.Body)

				// Uncommend this incase you want to get files with ACL = private
				// s3.getSignedUrl("getObject", { Bucket: process.env.S3_BUCKET_NAME, Key: fileName }, (err, url) => {
				//     if (err) {
				//         reject(err);
				//     } else {
				//         resolve({ Url: url, Etag: data.ETag });
				//     }
				// })
			}
		})
	})
}
