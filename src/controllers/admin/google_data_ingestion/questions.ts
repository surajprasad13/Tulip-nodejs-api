import { Request, Response } from 'express'
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import { QuestionsModel } from '../../../models'

const sheetGroupIdMapping: any = {
  // 'Hair Thinning Questions: MINI TULIP v 1.0 052722': 100,
  // Clinical: 2000,
  // questions: 2,
  // Autoimmune: null,
  // test: 8888,
  // Qualification: 2001,
  // 'Fatigue Tree Questions v1.0 060622': 102,
  // 'Qualificationv1.1': 2002,
  // 'Tulip CFS and FM': 2003,
  // 'High Blood Sugar Questions: MINI TULIP v1.0 060622': 103,
  // Intro: null,
  // 'Sleep Tree Questions: MINI TULIP v1.0 052922': 101,
  // knowledge: null,
  // 'Long Covid Questions': 104,
  // 'Free Long Covid': 105,
  'json': 106
}

export const ingestQuestions = async (request: Request, response: Response) => {
  try {
    const resultStats: any = {}

    const doc = new GoogleSpreadsheet('1oOjPaPLBHN5cmteDl-H-xGy0IXDgfqe3qRNxSP0MZEo')

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      private_key: process.env.GOOGLE_PRIVATE_KEY || '',
    })

    await doc.loadInfo()

    loadCustomSheets(doc.sheetsByTitle)

    for (const sheetTitle in sheetGroupIdMapping) {
      const sheet = doc.sheetsByTitle[sheetTitle]
      const groupId = +sheetGroupIdMapping[sheetTitle]
      const { counter, fails } = await migrateSheetToDB(sheet, groupId)

      if (counter) {
        resultStats[sheetTitle] = {}
        resultStats[sheetTitle].counter = counter
        resultStats[sheetTitle].fails = fails
      }
    }

    response.send(resultStats)
  } catch (error) {
    console.log(error)

    if (error instanceof Error) {
      return response.status(500).send({ message: error.toString() })
    }
    return response.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

function loadCustomSheets(sheetsByTitle: any) {
  const customSheetsTitles = Object.keys(sheetsByTitle).filter((k) => k.match(/\[\d+\]/))

  customSheetsTitles.forEach((k) => {
    sheetGroupIdMapping[k] = +((k.match(/\[(\d+)\]/) || [])[1] ?? 0) || null
  })
}

async function migrateSheetToDB(sheet: GoogleSpreadsheetWorksheet, groupId: number) {
  const fails: Array<any> = []
  var recs = [];
  
  if (!groupId) {
    return { counter: null, fails: null }
  }

  if (!sheet) {
    return { counter: null, fails: null }
  }

  let counter = 0

  await QuestionsModel.destroy({
    where: {
      group_id: groupId,
    },
  })

  const rows = await sheet.getRows()

  for (const row of rows) {
    const group_id = groupId
    const id_question = +row['id_question']
    const id_tree = +row['id_tree']
    const type = row['type']
    const question = row['question']
    const tags = row['tags'] || null

    let options

    try {
      options = JSON.parse(row['options'])
    } catch (e) {
      console.log(row['options'])

      throw new Error(
        `Error parsing JSON options of question ${id_question} groupId ${groupId} row index ${row.rowIndex}`
      )
    }

    if (groupId && id_question && id_tree && type && options) {
      const insert: any = {
        group_id,
        id_question,
        id_tree,
        type,
        question,
        options,
        tags,
      }

      recs.push(insert);

      counter++
    } else {
      fails.push({
        group_id,
        id_question,
        id_tree,
        type,
        question,
        options,
        tags,
      })
    }
  }

  await QuestionsModel.bulkCreate(recs);

  return { counter, fails }
}
