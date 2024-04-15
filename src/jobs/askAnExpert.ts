import cron from 'node-cron'
import { EVERY_DAY, EVERY_MINUTE, EVERY_HOUR } from '../constants/ScheduleConstants'
import config from '../config'
import db from '../db'
import AWS from 'aws-sdk'
import { ACL, SpaceName } from '../types/interface'
import transporter from '../services/mail'

const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? '')

const limitReachedEmails = ['tulip-monitor@meettulip.com', 'tulip-service@meettulip.com']

const env = config.ENV === 'local' ? 'dev' : config.ENV

const siteAssets = [   
    {
      dbName: 'defaultdb',
      query: 'select * from ask_expert_questions_answers where is_visible = true;',
      filename: `${env}_ask_expert_questions_answers.json`,
    },
  ]

  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  })

// cron.schedule(EVERY_MINUTE, async () => {
//     console.log('Running ask an expert export asset')
//     await updateSiteDataAssets()
// })

async function updateSiteDataAssets (){
    let count = 0
  
    try {
      for (const asset of siteAssets) {
        const { dbName, query, filename } = asset
        const [result, metadata] = await db[dbName].query(query)
  
        if (result) {
            if(result?.length > 1000000) {
                await reportLimitReached()
                return
            }

            console.log('RESULT: ', result?.length);
            
          const uploadResult = await new Promise((resolve, reject) => {
            s3.putObject(
              {
                Bucket: SpaceName.TulipNoCdn,
                Key: `tulip-web/data/${filename}`,
                ACL: ACL.public,
                Body: Buffer.from(JSON.stringify(result)),
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
    } catch (error) {
      console.log(error)
    }
  }

  async function reportLimitReached() {
    for (const email of limitReachedEmails) {
      await transporter.sendMail({
        from: 'noreply@meettulip.com',
        to: email,
        text: 'From Tulip',
        subject: 'Ask an Expert limit reached',
        html: `Ask an Expert limit reached.`,
      })
    }
  }