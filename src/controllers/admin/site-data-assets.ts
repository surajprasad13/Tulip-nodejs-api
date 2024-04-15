import { Request, Response } from 'express'
import { DeleteFileFromS3, UploadFileToS3 } from '../../services/s3'
import { ACL, SpaceName } from '../../types/interface'
import { getLoggedInAdminUserId } from '../../utils'
import db from '../../db'
import AWS from 'aws-sdk'
import { computeProgress, MaximumLength, updateSurveyWithMetadata } from '../../services/surveyEngine'
import config from '../../config'

const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? '')

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET,
})

const env = config.ENV === 'local' ? 'dev' : config.ENV

const siteAssets = [
  {
    dbName: 'defaultdb',
    query: 'select * from blogs',
    filename: `${env}_blogs.json`,
  },
  {
    dbName: 'defaultdb',
    query: 'select * from testimonials',
    filename: `${env}_testimonials.json`,
  },
  {
    dbName: 'decision',
    query: 'select * from decision.medications where cm = 1',
    filename: `${env}_medications.json`,
  },
  {
    dbName: 'decision',
    query: 'select * from decision.allergies',
    filename: `${env}_allergies.json`,
  },
  {
    dbName: 'decision',
    query: 'select id_group, id_question, answer_value, trim(survey_bubbles) as survey_bubbles from dashboard_reference dr where dr.survey_bubbles is not null;',
    filename: `${env}_survey_bubbles.json`,
  },
  {
    dbName: 'decision',
    query:
      'select	trim(dr2.question_type) as question_type, q.* from 	questions q left join (select max(dr.question_type) as question_type, dr.id_group, dr.id_question from dashboard_reference dr where dr.id_group = 101 group by dr.id_group ,dr.id_question) dr2 on (dr2.id_group = q.group_id) and (dr2.id_question = q.id_question) where q.group_id = 101;',
    filename: `${env}_sleep_questions.json`,
    tags: ['survey'],
  },
  {
    dbName: 'decision',
    query:
      'select	trim(dr2.question_type) as question_type, q.* from 	questions q left join (select max(dr.question_type) as question_type, dr.id_group, dr.id_question from dashboard_reference dr where dr.id_group = 102 group by dr.id_group ,dr.id_question) dr2 on (dr2.id_group = q.group_id) and (dr2.id_question = q.id_question) where q.group_id = 102;',
    filename: `${env}_fatigue_questions.json`,
    tags: ['survey'],
  },
  {
    dbName: 'decision',
    query:
      'select	trim(dr2.question_type) as question_type, q.* from 	questions q left join (select max(dr.question_type) as question_type, dr.id_group, dr.id_question from dashboard_reference dr where dr.id_group = 103 group by dr.id_group ,dr.id_question) dr2 on (dr2.id_group = q.group_id) and (dr2.id_question = q.id_question) where q.group_id = 103;',
    filename: `${env}_high_blood_sugar_questions.json`,
    tags: ['survey'],
  },
  {
    dbName: 'decision',
    query:
      'select	trim(dr2.question_type) as question_type, q.* from 	questions q left join (select max(dr.question_type) as question_type, dr.id_group, dr.id_question from dashboard_reference dr where dr.id_group = 104 group by dr.id_group ,dr.id_question) dr2 on (dr2.id_group = q.group_id) and (dr2.id_question = q.id_question) where q.group_id = 104;',
    filename: `${env}_long_covid_questions.json`,
    tags: ['survey'],
  },
  {
    dbName: 'decision',
    query:
      'select	trim(dr2.question_type) as question_type, q.* from 	questions q left join (select max(dr.question_type) as question_type, dr.id_group, dr.id_question from dashboard_reference dr where dr.id_group = 105 group by dr.id_group ,dr.id_question) dr2 on (dr2.id_group = q.group_id) and (dr2.id_question = q.id_question) where q.group_id = 105;',
    filename: `${env}_free_long_covid_questions.json`,
    tags: ['survey'],
  },
  {
    dbName: 'defaultdb',
    query: 'select * from teams',
    filename: `${env}_teams.json`,
  },
  {
    dbName: 'decision',
    query: 'select * from dynamic_content',
    filename: `${env}_dynamic_content.json`,
  },
  {
    dbName: 'defaultdb',
    query: 'select * from ask_expert_questions_answers where is_visible = true;',
    filename: `${env}_ask_expert_questions_answers.json`,
  },
  {
    dbName: 'decision',
    query: 'select DISTINCT st.id_item, st.category, st.name from decision.symptom_tracker st;',
    filename: `${env}_symptom_tracker.json`,
  },
]

export const updateSiteDataAssets = async (req: Request, res: Response) => {
  let count = 0

  try {
    for (const asset of siteAssets) {
      const { dbName, query, filename, tags } = asset
      const [result, metadata] = await db[dbName].query(query)

      if (result) {
        let rr: any
        if (tags != undefined && tags.indexOf('survey') > -1) {
          let surveyMax: any = {}
          let surveyMax2: any, graph: any, questionsUpdated: any;
          [surveyMax2, graph, questionsUpdated] = computeProgress(result, null, null, surveyMax);
          var up = updateSurveyWithMetadata(result, surveyMax2)
          rr = up
        } else rr = result

        const uploadResult = await new Promise((resolve, reject) => {
          s3.putObject(
            {
              Bucket: SpaceName.TulipNoCdn,
              Key: `tulip-web/data/${filename}`,
              ACL: ACL.public,
              Body: Buffer.from(JSON.stringify(rr)),
              ContentType: 'application/json',
            },
            (err, data: any) => {
              if (err) {
                reject(err)
              } else {
                resolve(true)
              }
            }
          )
        })

        if (uploadResult) {
          count++
        }
      }
    }

    res.send({ success: count === siteAssets.length })
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}
