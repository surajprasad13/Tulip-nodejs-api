import { Request, Response } from "express"
import Medications from "../../models/medications"
import { getMedications } from "../../utils/getMedications"

export const getContra = async (req: Request, res: Response) => {
	const userMedications = await getMedications(req.body.payload.user_id)
	if(userMedications.length > 0){
		await checkContra(res,userMedications)
	} else {
		res.status(201).json({
			message: `Medications for this user not found`,
		})
	}
}

export const checkContra = async (res: Response, userMedications: any) => {
	const medications = await Medications.findAll({
		raw: true,
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})
	if (medications[0]) {
		await countContra(res, userMedications, medications)
	} else {
		res.status(404).json({
			msg: `Database error (medications). Contact Admin`,
		})
	}
}

export const countContra = async (res: Response, userMedications: any, medications: any) => {
    let contraindications:any = []
	userMedications.forEach((val: any) => {
		let forbidden = medications.filter((val2: any) => val == val2.id.toString())
		if(forbidden.length > 0) {
			contraindications.push(
				{
					medication: forbidden[0].brand_name + " / " + forbidden[0].generic_name, 
					avoid: {
						supplements: forbidden[0].supplement_contraindications,
						food: forbidden[0].food_contraindications
					}
				}
			)
		}
		
	})
    res.json(contraindications)
}