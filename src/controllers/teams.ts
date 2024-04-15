import { Request, Response } from "express"
import TeamModel from "../models/teams"

const fetchTeams = async (req: Request, res: Response) => {
	try {
		const limit = +(req.query.limit ?? 10)
		const offset = +(req.query.offset ?? 0)

		const { count, rows } = await TeamModel.findAndCountAll({ limit, offset })

		res.send({ count, data: rows })
	} catch (error) {
		res.status(400).send({ error })
	}
}

export { fetchTeams }
