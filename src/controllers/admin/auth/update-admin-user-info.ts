import { Request, Response } from 'express'
import { verify } from 'jsonwebtoken'
import AdminUserModel from '../../../models/admin/admin-user'
import AWS from 'aws-sdk'
import config from "../../../config"

export const updateAdminUserInfo = async (req: Request, res: Response) => {
  try {
    const updateData: any = {}

    const doctorId = getDoctorId(req)

    if (!doctorId) {
      return res.status(404).json({
        msg: 'Unable to get doctor id.',
      })
    }

    const designation = req.body.designation || null
    const name = req.body.name || null
    const pushSubscription = req.body.pushSubscription

    if (designation) {
      updateData.designation = designation
    }

    if (name) {
      updateData.name = name
    }

    if (pushSubscription !== undefined) {
      updateData.push_subscription = pushSubscription
    }

    let profileImage = null

    if (req.file) {
      const originalnameParts = (req.file?.originalname ?? '').split('.')

      const uploadedFile: any = await uploadFileToS3(
        req.file.buffer,
        doctorId,
        originalnameParts[originalnameParts.length - 1] ?? ''
      )

      if (uploadedFile?.Url) {
        profileImage = uploadedFile?.Url
      }
    }

    if (profileImage) {
      updateData.profile_image = profileImage
    }

    await AdminUserModel.update(updateData, {
      where: { id: doctorId },
    })

    const adminUserInfo = await AdminUserModel.findOne({
      raw: true,
      where: {
        id: doctorId,
      },
    })

    res.json({
      id: adminUserInfo.id,
      profileImage: adminUserInfo.profile_image,
      name: adminUserInfo.name,
      email: adminUserInfo.email,
      designation: adminUserInfo.designation,
    })
  } catch (err) {
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

function getDoctorId(req: Request) {
  const token = (req.headers.authorization ?? '').replace('Bearer', '').trim()

  if (token) {
    try {
      const payload: any = verify(token, process.env.ADMIN_JWT_PRIVATE_KEY ?? ' ')

      return payload?.userId ?? null
    } catch (err) {
      console.log(err)
    }
  }
}

const uploadFileToS3 = (file: Buffer, userId: number, ext: string) => {
  const spacesName = 'doctor-profile'
  const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? '')
  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  })

  const fileName = `${config.NODE_ENV}_${userId}_${Date.now()}.${ext}`

  return new Promise((resolve, reject) => {
    s3.putObject({ Bucket: spacesName ?? '', Key: fileName, ACL: 'public-read', Body: file }, (err, data: any) => {
      if (err) {
        reject(err)
      } else {
        data.Url = `https://${spacesName}.${process.env.SPACES_ENDPOINT}/${fileName}`
        resolve(data)
      }
    })
  })
}
