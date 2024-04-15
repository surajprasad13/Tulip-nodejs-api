import { Request, Response } from "express"
import NutritionalGuidelinesMaster from "../../models/masters/nutritional_guidelines_master"

export const getNutritionalGuidelinesMaster = async(req: Request, res: Response) => {
    try{
        const info = await NutritionalGuidelinesMaster.findAll({
            raw: true,
        })
		res.send({
            info
		})
	} catch (error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}
}
