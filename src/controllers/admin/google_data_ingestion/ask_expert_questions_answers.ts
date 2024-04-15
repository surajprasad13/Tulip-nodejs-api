import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import AskExpertQuestionsAnswersModel from '../../../models/ask_expert_questions_answers'


export const ingestAskExpertQuestionsAnswers = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1_HHmjZsJ5_dd7RTJ6Rzv-IKWZyDdoV-k4JxtQCgVCvE')

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

  await AskExpertQuestionsAnswersModel.destroy({
    where: {is_initial_dataset: true},
  })

  const rows = await sheet.getRows()
  for (const row of rows) {
    const category = row['Category'] || null
    const question = row['Question'] || null
    const answer = row['Answer'] || null

    if (category && question && answer) {
      const insert: any = {
        category,
        question,
        answer,
        is_initial_dataset: true,
        is_visible: true,
      }

      recs.push(insert);
      counter++
    } else {
      fails.push({
        category,
        question,
        answer,
      })
    }
  }

  await AskExpertQuestionsAnswersModel.bulkCreate(recs);

  return { counter, fails }
}
