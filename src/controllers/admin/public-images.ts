import { Request, Response } from 'express'
import { DeleteFileFromS3, UploadFileToS3 } from '../../services/s3'
import { ACL } from '../../types/interface'
import { getLoggedInAdminUserId } from '../../utils'

export const postPublicImage = async (req: Request, res: Response) => {
  try {
    const originalnameParts = (req.file?.originalname ?? '').split('.')

    if (!req.body.spaceName) {
      return res.status(400).send({ message: 'Space name is mandatory.' })
    }

    if (!req.file) {
      return res.status(400).send({ message: 'File is mandatory.' })
    }

    const uploaded: any = await UploadFileToS3(
      req.body.spaceName,
      ACL.public,
      req.file.buffer,
      getLoggedInAdminUserId(req),
      originalnameParts[originalnameParts.length - 1] ?? '',
      req.file.mimetype
    )

    if (uploaded.Url) {
      res.send({ url: uploaded.Url })
    } else {
      res.send({ message: 'Error in uploading file' })
    }
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const deletePublicImage = async (req: Request, res: Response) => {
  try {
    await DeleteFileFromS3(req.query.spaceName?.toString() ?? '', req.query.fileName?.toString() ?? '')

    res.send()
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}
