import { Request, Response } from "express"
import ResearchModel from "../models/research"
import ResearchSubscription from "../models/research_subscription"
const { PubSub } = require('@google-cloud/pubsub');

const fetchResearch = async (req: Request, res: Response) => {
	try {
		const limit = +(req.query.limit ?? 10)
		const offset = +(req.query.offset ?? 0)

		const { count, rows } = await ResearchModel.findAndCountAll({ limit, offset })

		res.send({ count, data: rows })
	} catch (error) {
		res.status(500).send({ error })
	}
}

const setResearch = async (req: Request, res: Response) => {
	try {
		const first_name = req.body.first_name
		const last_name = req.body.last_name
		const email = req.body.email
		const details = req.body.details

		const insert = {
			first_name: first_name,
			last_name: last_name,
			email: email,
			details: details
		}
	
		publishMessage(insert)

		res.send({ msg: "Data saved successfully" })
	} catch (error) {
		res.status(500).send({ error })
	}
}

async function publishMessage(msg:any) {
    const pubSubClient = new PubSub();
    const data = JSON.stringify(msg);
    const dataBuffer = Buffer.from(data);
    const topicNameOrId = 'projects/tulipaimlserver/topics/tulip-prod-research-subscribe';
  
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

export { fetchResearch, setResearch }
