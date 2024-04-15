import { Request, Response } from "express"
import SymptomMaster from "../../models/masters/symptom_master"

export const getSymptomMaster = async(req: Request, res: Response) => {
    try{
        const info = await SymptomMaster.findAll({
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


