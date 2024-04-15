import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import QuestionRemedies from '../../../models/questionremedies'

export const ingestQuestionRemedies = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1n_pnPToA3OteYjg3l9NRvZLNMqTnIWjmwUvLRf2V-7E')

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      private_key: process.env.GOOGLE_PRIVATE_KEY || '',
    })

    await doc.loadInfo()

    const { counter, fails } = await migrateSheetToDB(doc.sheetsByIndex[0])

    resultStats.counter = counter
    resultStats.fails = fails

    response.send(resultStats)
  } catch (error) {
    console.log(error)

    response.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

async function migrateSheetToDB(sheet: GoogleSpreadsheetWorksheet) {
  const fails: Array<any> = []

  if (!sheet) {
    return { counter: null, fails: null }
  }
  let counter = 0
  await QuestionRemedies.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const id_group = +row['Tree#'] ?? null
    const id_question = +row['id_question'] ?? null
    const answer_value = row['answer_value'] ?? null
    const remedy_type = row['remedy_type'] ?? null
    const remedy_id = +row['remedy_id'] ?? null
    const weight = +row['Weight'] ?? null
    const exception = row['Exemption'] ?? null

    if (id_group && id_question) {
      const insert: any = {
        id_group,
        id_question,
        answer_value,
        remedy_type,
        remedy_id,
        weight,
        exception,
      }

      await new QuestionRemedies(insert).save()
      counter++
    } else {
      fails.push({
        id_group,
        id_question,
        answer_value,
        remedy_type,
        remedy_id,
        weight,
        exception,
      })
    }
  }
  return { counter, fails }
}
