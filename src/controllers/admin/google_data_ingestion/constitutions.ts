import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import ConstitutionsMain from '../../../models/constitutions_main'

export const ingestConstitutions = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('16r5zNOEl86xRYCEsCK8zVZQIdLB6Nt1qGDVHtfEmyv4')

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      private_key: process.env.GOOGLE_PRIVATE_KEY || '',
    })

    await doc.loadInfo()

    const { counter, fails} = await migrateSheetToDBMain(doc.sheetsByIndex[1])

    resultStats.counter = counter
    resultStats.fails = fails

    response.send(resultStats)
  } catch (error) {
    console.log(error)

    response.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

async function migrateSheetToDBMain(sheet: GoogleSpreadsheetWorksheet) {
  const fails: Array<any> = []
  var recs = [];
  
  if (!sheet) {
    return { counter: null, fails: null }
  }
  let counter = 0

  await ConstitutionsMain.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const constitution_id = +row['id'] || null
    const id_group = +row['id_group'] || null
    const constitution = row['constitution'] || null
    const information_to_show = row['information_to_show'] || null
    const foods_to_increase = row['foods_to_increase'] || null
    const foods_to_decrease = row['foods_to_decrease'] || null
    const shopping_list = row['shopping_list'] || null
    const preset_id = row['preset_id'] || null

    if (constitution_id && constitution) {
      const insert: any = {
        constitution_id,
        id_group,
        constitution,
        information_to_show,
        foods_to_increase,
        foods_to_decrease,
        shopping_list,
        preset_id,
      }

      recs.push(insert);
      counter++
    } else {
      fails.push({
        constitution_id,
        id_group,
        constitution,
        information_to_show,
        foods_to_increase,
        foods_to_decrease,
        shopping_list,
        preset_id,
      })
    }
  }

  await ConstitutionsMain.bulkCreate(recs);

  return { counter, fails }
}