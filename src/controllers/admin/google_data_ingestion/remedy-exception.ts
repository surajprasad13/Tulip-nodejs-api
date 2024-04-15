import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import RemediesExceptions from '../../../models/remediesexceptions'

export const ingestRemedyException = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1mSduQZww-sI4uT6YxQCPq5Y1ivnywZY_NkxOBTUtS5M')

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
  var recs = [];

  if (!sheet) {
    return { counter: null, fails: null }
  }
  let counter = 0
  await RemediesExceptions.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const id_group = row['Tree#'] ?? null
    const exception_type = row['exception_type'] ?? null
    const exception_rule = row['exception_rule'] ?? null

    if (id_group && exception_type && exception_rule) {
      const insert: any = {
        id_group,
        exception_type,
        exception_rule,
      }

      recs.push(insert);
      counter++
    } else {
      fails.push({
        id_group,
        exception_type,
        exception_rule,
      })
    }
  }

  await RemediesExceptions.bulkCreate(recs);

  return { counter, fails }
}
