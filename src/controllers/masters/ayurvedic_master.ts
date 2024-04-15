import { Request, Response } from "express"
import AyurvedicMaster from "../../models/masters/ayurvedic_master";

export const getAyurvedicMaster = async(req: Request, res: Response) => {
    try{
		res.send((await AyurvedicMaster.findAll({ raw: true }))??[])
	} catch (error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}
}
