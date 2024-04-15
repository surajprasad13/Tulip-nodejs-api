import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import Medications from '../../../models/medications'

export const ingestEpocrates = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1frf7RtCFMCiCmfzFt8kFkJzPapoFui7lHiqRRi1HG5E')

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
  await Medications.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const drug_class = row['DRUG CLASS'] ?? null
    const id = +row['medication_id'] ?? null
    const drug_sub_class = row['Drug Sub Class'] ?? null
    const brand_name = row['Brand Name'] ?? null
    const generic_name = row['Generic Name'] ?? null
    const nutrients_depleted = row['NUTRIENTS DEPLETED'] ?? null
    const cm = +row['CM'] ?? null
    const supplement_contraindications = row['Herb/Supplement Contraindications'] ?? null
    const food_contraindications = row['Foods/Drinks Contraindications'] ?? null

    if (id && brand_name && generic_name && drug_class && drug_sub_class) {
      const insert: any = {
        drug_class,
        id,
        drug_sub_class,
        brand_name,
        generic_name,
        nutrients_depleted,
        cm,
        supplement_contraindications,
        food_contraindications,
      }

      await new Medications(insert).save()
      counter++
    } else {
      fails.push({
        drug_class,
        id,
        drug_sub_class,
        brand_name,
        generic_name,
        nutrients_depleted,
        cm,
        supplement_contraindications,
        food_contraindications,
      })
    }
  }

  return { counter, fails }
}
