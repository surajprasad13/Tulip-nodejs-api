import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import DynamicContent from '../../../models/dynamic_content'

export const ingestDynamicTexts = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1FME3iUu5fdHj0i9Z_4acCT_3CaN2VwuEoaEU_yMhuUU')

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      private_key: process.env.GOOGLE_PRIVATE_KEY || '',
    })

    await doc.loadInfo()

    const { counter, fails } = await migrateSheetToDB(doc.sheetsByIndex[0], doc.sheetsByIndex[1])

    resultStats.counter = counter
    resultStats.fails = fails

    response.send(resultStats)
  } catch (error) {
    console.log(error)

    response.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

async function migrateSheetToDB(sheet: GoogleSpreadsheetWorksheet, sheetSections: GoogleSpreadsheetWorksheet) {
  const fails: Array<any> = []
  var recs = [];

  if (!sheet) {
    return { counter: null, fails: null }
  }
  let counter = 0
  await DynamicContent.destroy({
    where: {},
    truncate: true,
  })

  var sections = await sheetSections.getRows();

  const rows = await sheet.getRows()
  for (const row of rows) {
    const id_group = +row['id_group']
    const id_section = +row['id_section']
    const content = row['text']
    const sectionName = sections.filter((x: any) => x['id_section'] == id_section)[0]['name'];


    if (id_group && id_section && content && sectionName) {
      const insert: any = {
        id_group,
        id_section,
        content,
        sectionName
      }
      recs.push(insert);
      counter++
    } else {
      fails.push({
        id_group,
        id_section,
        content,
      })
    }
  }

  await DynamicContent.bulkCreate(recs);

  return { counter, fails }
}
