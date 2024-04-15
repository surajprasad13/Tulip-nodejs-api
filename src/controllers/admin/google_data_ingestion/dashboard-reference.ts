import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import DashboardReference from '../../../models/dashboard_reference'

export const ingestDashboardReference = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('16r5zNOEl86xRYCEsCK8zVZQIdLB6Nt1qGDVHtfEmyv4')

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

  await DashboardReference.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const id_group = +row['id_group'] || null
    const health_number = row['health_number'] || null
    const id_question = +row['id_question'] || null
    const answer_value = row['answer_value'] || null
    const question_type = row['question_type'] || null
    const survey_bubbles = row['survey_bubbles'] || null
    const preset_ids = row['preset_ids'] || null
    const root_cause = row['root_cause'] || null
    const tcm_root_cause = row['TCM_root cause'] || null
    const mad_libs_root_cause = row['mad_libs_root cause'] || null
    const health_score = row['health_score'] || null
    const mad_libs_suboptimal = row['mad_libs_suboptimal'] || null
    const constitution_id_insights = +row['constitution_id_insights'] || null

    if (id_group && id_question && answer_value) {
      const insert: any = {
        id_group,
        health_number,
        id_question,
        answer_value,
        question_type,
        survey_bubbles,
        preset_ids,
        root_cause,
        tcm_root_cause,
        mad_libs_root_cause,
        health_score,
        mad_libs_suboptimal,
        constitution_id_insights,
      }

      recs.push(insert);
      counter++
    } else {
      fails.push({
        id_group,
        health_number,
        id_question,
        answer_value,
        question_type,
        survey_bubbles,
        preset_ids,
        root_cause,
        tcm_root_cause,
        mad_libs_root_cause,
        health_score,
        mad_libs_suboptimal,
        constitution_id_insights,
      })
    }
  }

  await DashboardReference.bulkCreate(recs);
  return { counter, fails }
}
