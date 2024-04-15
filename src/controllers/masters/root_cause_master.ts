import { Request, Response } from "express"
import RootCauseMaster from "../../models/masters/root_cause_master"
import SymptomMaster from "../../models/masters/symptom_master"

export const getRootCauseMaster = async(req: Request, res: Response) => {
    try{
        const symptoms = req.body.symptoms
        
        const symptomsMaster = (await SymptomMaster.findAll({})).reduce((acc: any, s: any) => {
			acc[s.symptom_id] = s.symptom_name
			return acc
		}, {})

        const info = ((await RootCauseMaster.findAll({
            raw: true,
            where: {
                symptom_id: symptoms
            },
        }))??[]).map((r: any) => ({
            ...r,
            symptom_name: symptomsMaster[r.symptom_id]
        }))

		res.send({
            info
		})
	} catch (error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}

}