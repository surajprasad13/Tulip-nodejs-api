import { Request, Response } from "express"
import { UserModel } from "../models"
import SubscriptionUserModel from "../models/user/newsletterSubscription"
import WaitListModel from "../models/user/waitListSubscription";
const { PubSub } = require('@google-cloud/pubsub');
import axios from 'axios';

const MAILERLITE_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiYTFkNmFiMzUwNDJkYTMyMzAxOTExOGU5NDgwYWI3MDAzZTI0OTBlZmFjNGQzZDg3MjYzNTlmNTRhM2MwY2NlYWY4ZjY1YmFhZTc4YWEwYWYiLCJpYXQiOjE3MDM3OTMwNTkuOTE4MDU2LCJuYmYiOjE3MDM3OTMwNTkuOTE4MDU5LCJleHAiOjQ4NTk0NjY2NTkuOTEzOTMsInN1YiI6Ijc0MDU5NCIsInNjb3BlcyI6W119.YJKWMy06e4m-DCZEyKL1njbQ3SyUSxEhKalDsSZYrS_hpWbC02oN9MUpRKVcIHpVO7mDRoSWljcJUANL8-oIVwg-XQTxCWUn-l-QFXPq8xpj457aozDlfh8J-cTP0V2DvMPOf81O9yMSFUOi2PBNxpgWSfb-SQBHH7JKP27TgyDupaziZKexA0r-FnujYR8kPa_Hp3VRJREOtpZzFpVXl-gp10ab6YxgdIJnjydpbcxQ_R95kKBaAxTJvXtVyhOFiAyx8rnlrJm34Cz0e7QxtiKvW0MvdRRGWGJt5_xocS8OG0KVbEfB93mqTK5ENFne_o5cHa_MEaypeM-JhX9wfwlXq0T5CZKV5PjN-rpBZ6hxPCVrz2icQYyPVYV3JrPeWMUnh9vjpWpAVSZDsiY_GGn4ew3cEexsEq1B1yU_fyzz6wNtJ8TIPfN631okmAfIjHG36v50XCj_wtdSf6gJ2K1b8YeOcKIRoO-yENdMN_viByEXvDnuYSfOn7uEYb7SOB0MlC6_jiZVkwJiFDWa-nhTtTB290FBzsD_KFVbmx1FJ6LjJRTdWjAZOL2Oc_XbphxSAP8VTaAVVt-zuAbCDf090ZQQ3W9MJrhVxtHCV4nXhPi0-CFbFA36laMP1C47llwyjaA5bHt4Pbv3AqonH6CQp9WeDbzSoWK7s5aoZLA';

const MAILERLITE_GROUP_ID = '108834727415252814';

export const addNewsLetter =  async (req: Request, res: Response) => {
    try {
        const email = req.body.email

        const insert = {
            email: email,
            active: 1
        }

        // publishMessage(insert)

        const response = await axios.post(`https://api.mailerlite.com/api/v2/groups/${MAILERLITE_GROUP_ID}/subscribers`, insert, {
            headers: {
                'Content-Type': 'application/json',
                'X-MailerLite-ApiKey': MAILERLITE_API_KEY
            }
        });
        res.json({msg: "email saved successfully"})
    } catch (error) {
        res.status(500).send({
            msg: `${error}. Contact Admin`,
        })
    }
}

async function publishMessage(msg:any) {
    const pubSubClient = new PubSub();
    const data = JSON.stringify(msg);
    const dataBuffer = Buffer.from(data);
    const topicNameOrId = 'projects/tulipaimlserver/topics/tulip-prod-newsletter';
  
    try {
      const messageId = await pubSubClient
        .topic(topicNameOrId)
        .publishMessage({ data: dataBuffer });
      console.log(`Message ${messageId} published.`);
    } catch (error:any) {
      console.error(`Received error while publishing: ${error.message}`);
      process.exitCode = 1;
    }
  }

export const removeNewsLetter =  async (req: Request, res: Response) => {
    try {
        const id = req.body.payload.user_id

        let mail = await UserModel.findOne({
            raw: true,
            attributes: ["email"],
            where: {
                user_id: id
            },
        })

        await SubscriptionUserModel.destroy({
            where: mail,
        })

        res.json({msg: "email removed successfully"})
    } catch (error) {
        res.status(500).send({
            msg: `${error}. Contact Admin`,
        })
    }
}

export const addWaitList = async (req: Request, res: Response) => {
    try {
        const insert = {
            name: req.body.name,
            email: req.body.email
        }
        const waitlist = new WaitListModel(insert)
	    await waitlist.save()
        res.json({msg: "email saved successfully"})
    } catch (error) {
        res.status(500).send({
            msg: `${error}. Contact Admin`,
        })
    }
}