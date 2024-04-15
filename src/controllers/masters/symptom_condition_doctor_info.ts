import { Request, Response } from "express"
import TreatmentMaster from "../../models/masters/treatment_master"
import SymptomConditionDoctorInfo from "../../models/symptom_condition_doctor_info"

export const getSymptomConditionDoctorInfo = async(req: Request, res: Response) => {
    try{
        const info = await SymptomConditionDoctorInfo.findOne({
            raw: true,
			where: {
				symptom_id: req.query.symptom_id??0
			}
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




