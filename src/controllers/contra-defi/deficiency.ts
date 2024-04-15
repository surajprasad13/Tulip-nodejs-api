import { Request, Response } from "express"
import Medications from "../../models/medications"
import { getMedications } from "../../utils/getMedications"

export const getDeficiency = async (req: Request, res: Response) => {
	const userMedications = await getMedications(req.body.payload.user_id)
	if(userMedications.length > 0){
		await checkDeficiency(req,res,userMedications)
	} else {
		res.status(201).json({
			message: `Medications for this user not found`,
		})
	}
}

export const checkDeficiency = async (req: Request, res: Response, userMedications: any) => {
	const medications = await Medications.findAll({
		raw: true,
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})

	if (medications[0]) {
		await countDeficiencies(req, res, userMedications, medications)
	} else {
		res.status(404).json({
			msg: `Database error (medications). Contact Admin`,
		})
	}
}

export const countDeficiencies = async (req: Request, res: Response, userMedications: any, medications: any) => {
	let deficiencies: any = []
	userMedications.forEach((val: any) => {
		let listed = medications.filter((val2: any) => val == val2.id.toString())
		if(listed.length > 0) {
			deficiencies.push({
					medication: listed[0].brand_name + " / " + listed[0].generic_name, 
					deficiency: listed[0].nutrients_depleted
			})
		}
		
	})
	res.json(deficiencies)
}
