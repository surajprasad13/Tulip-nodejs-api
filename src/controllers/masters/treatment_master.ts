import { Request, Response } from "express"
import TreatmentMaster from "../../models/masters/treatment_master"

export const getTreatmentMaster = async(req: Request, res: Response) => {
    try{
        const info = await TreatmentMaster.findAll({
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




