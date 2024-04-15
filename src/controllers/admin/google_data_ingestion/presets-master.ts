import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import Presets from '../../../models/presets'

export const ingestPresetsMaster = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1KsonnpInXW3p_KuPPVX5cWmYJd0KWBf3-TiWv0_gV9U')

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

  await Presets.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const preset_id = +row['preset_id'] || null
    const id_group = +row['Tree#'] || null
    const remedy_type = row['remedy_type'] || null
    const remedy_id = +row['remedy_id'] || null

    if (preset_id && id_group && remedy_type && remedy_id) {
      const insert: any = {
        preset_id,
        id_group,
        remedy_type,
        remedy_id,
      }

      recs.push(insert);
      counter++
    } else {
      fails.push({
        preset_id,
        id_group,
        remedy_type,
        remedy_id,
      })
    }
  }

  await Presets.bulkCreate(recs);

  return { counter, fails }
}
