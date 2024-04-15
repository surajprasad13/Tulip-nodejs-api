import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import RemedyAlternatives from '../../../models/remedyalternatives'

export const ingestRemedyAlternative = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1fYPNT2pTKNILdsyrzQi4FvrSXWLhlSuQd2E-esHAIjg')

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      private_key: process.env.GOOGLE_PRIVATE_KEY || '',
    })

    await doc.loadInfo()

    const { counter, fails } = await migrateSheetToDB(doc.sheetsByIndex[1])

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
  await RemedyAlternatives.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const options: any = {}

    const id_group = +row['Tree#'] ?? null
    const remedy_type = strClean(row['remedy_type'])
    const name = strClean(row['Name'])
    const remedy_id = +row['remedy_id'] ?? null
    const brand = strClean(row['Brand'])
    const link_coupon_code = strClean(row['Link/Coupon Code'])
    const allergy_id = strClean(row['allergy_id'])
    options.descriptions = strClean(row['Descriptions'])
    options.suggested_usage = strClean(row['Suggested Usage'])
    options.subtitle = strClean(row['Subtitle'])
    options.bullet_points = strClean(row['Bullet Points'])
    options.recipe = strClean(row['Recipe'])
    options.reference_links = strClean(row['Reference links'])
    options.medication_interaction_ids = strClean(row['medication_interaction_ids'])
    options.ingredient_breakdown_allergies = strClean(row['INGREDIENT BREAKDOWN FOR ALLERGIES'])
    options.herb_nutrient = strClean(row['Herb (H) or Nutrient (N)'])
    options.warming_cooling_neutral = strClean(row['(W)arming or (C)ooling or (N)eutral'])
    options.ingredients = strClean(row['Rough Ingredient List'])
    options.reactions = strClean(row['Reactions'])
    options.minor = strClean(row['Minor'])
    options.special_precautions = strClean(row['Special Precautions'])
    options.single_blend = strClean(row['Single (S) or Blend (B)'])
    options.fundamental_nutrition_core_essentials_additional_support = strClean(
      row['Fundamental Nutrition (F) or Core Essentials (C) or Additional Support(A)']
    )

    if (id_group && name) {
      const insert: any = {
        id_group,
        remedy_type,
        name,
        remedy_id,
        brand,
        link_coupon_code,
        options,
        allergy_id,
      }

      await new RemedyAlternatives(insert).save()
      counter++
    } else {
      fails.push({
        id_group,
        remedy_type,
        name,
        remedy_id,
        brand,
        allergy_id,
        link_coupon_code,
        options,
      })
    }
  }
  return { counter, fails }
}

function strClean(data: string) {
  if (!data) {
    return null
  }

  if (data.replace(/\s/g, '').length) {
    return data
  }

  return null
}
