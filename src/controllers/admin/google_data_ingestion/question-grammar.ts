import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import QuestionGrammar from '../../../models/questiongrammar'

export const ingestQuestionGrammar = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1_zEai1UgubG0jePygsjleeAQqTVXJD474KZAk-Sqjjc')

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

  await QuestionGrammar.destroy({
    where: {},
    truncate: true,
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const id_group = +row['Tree #'] || null
    const health_number = row['Question Number'] || null
    const id_question = +row['id_question'] || null
    const answer_value = row['answer_value'] || null
    const populate = row['What to populate'] || null

    if (id_group && health_number && id_question && answer_value && populate) {
      const insert: any = {
        id_group,
        health_number,
        id_question,
        answer_value,
        populate,
      }

      recs.push(insert);
      counter++
    } else {
      fails.push({
        id_group,
        health_number,
        id_question,
        answer_value,
        populate,
      })
    }
  }

  await QuestionGrammar.bulkCreate(recs);  

  return { counter, fails }
}
