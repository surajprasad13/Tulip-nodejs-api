import { Request, Response } from 'express'
import NesletterTemplate from '../../models/newsletter_template'

export const createNewsletterTemplate = async (req: Request, res: Response) => {
  try {

    const title = req.body.title
    const subject = req.body.subject
    const html = req.body.html
    
    const insert = {
      title: title,
      subject: subject,
      html: html
    }
  
    const template = new NesletterTemplate(insert)
    await template.save()
    res.send({msg:"Template Saved"})
  } catch (error) {
    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const updateNewsletter = async (req: Request, res: Response) => {
  try {
    const id_template = req.body.id_template
    const updatedRows = await NesletterTemplate.update(
      {
        status: "to_send",
      },
      {
        where: { id: id_template },
      }
    )
    res.send({updated_rows: updatedRows})
  } catch (error) {
    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}