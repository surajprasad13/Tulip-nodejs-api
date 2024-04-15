import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import Allergies from '../../../models/allergies'
import Presets from '../../../models/presets'

export const ingestAllergyMaster = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1Csfla11XDPy9ceETIpka-2nufkbD_uQrcffW07kPFxw')

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

  await Allergies.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const allergy_id = +row['allergy_id'] || null
    const allergy_type = row['allergy_type'] || null
    const name = row['name'] || null

    if (allergy_id && allergy_type && name) {
      const insert: any = {
        allergy_id,
        allergy_type,
        name,
      }

      recs.push(insert);

      counter++
    } else {
      fails.push({
        allergy_id,
        allergy_type,
        name,
      })
    }
  }

  await Allergies.bulkCreate(recs);

  return { counter, fails }
}
