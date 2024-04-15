import { Request, Response } from "express"
import SymptomConditionMaster from "../../models/symptom_condition_master"

export const getSymptomConditionMaster = async(req: Request, res: Response) => {
    try{
        const info = await SymptomConditionMaster.findAll({
            raw: true,
			attributes: ['id', 'symptom_id', 'symptom_name', 'symptom_type']
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


