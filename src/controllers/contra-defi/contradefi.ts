import { Request, Response } from "express"
import Medications from "../../models/medications"
import UserContraDefiModel from '../../models/user/userContraDefi';

export const getContraDefi = async (req: Request, res: Response) => {
	const userMedications = req.body.medication_list?.split(",")
	if(userMedications?.length > 0){
		await checkContraDefi(req,res,userMedications)
	} else {
		res.status(201).json({
			message: `The medications must be numbers separate by commas`,
		})
	}
}

export const checkContraDefi = async (req: Request, res: Response, userMedications: any) => {
	const medications = await Medications.findAll({
		raw: true,
	}).catch((error: any) => {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	})

	if (medications[0]) {
		await countContraDefi(req, res, userMedications, medications)
	} else {
		res.status(404).json({
			msg: `Database error (medications). Contact Admin`,
		})
	}
}

export const countContraDefi = async (req: Request, res: Response, userMedications: any, medications: any) => {
	const id_user = req.body.payload.user_id
	let contradefi: any = []
	userMedications.forEach((val: any) => {
		let listed = medications.filter((val2: any) => val == val2.id.toString())
		if(listed.length > 0) {
			contradefi.push({
					medication: listed[0].brand_name + " / " + listed[0].generic_name, 
					deficiency: listed[0].nutrients_depleted,
                    avoid: {
						supplements: listed[0].supplement_contraindications,
						food: listed[0].food_contraindications
					}
			})
		}
		
	})
	const insert = {
		user_id: id_user,
		data: {"medications": userMedications, "contradefi": contradefi}
	}
	const userContraDefi = new UserContraDefiModel(insert)
	await userContraDefi.save()
	res.json(contradefi)
}

export const getSavedContraDefi = async (req: Request, res: Response) => {
	try {
		const id = req.body.payload.user_id
		const userContraDefi = await UserContraDefiModel.findOne({
			raw: true,
			where: {
				user_id: id
			},
			order: [["updatedAt", "DESC"]],
		}) || 0
		if (userContraDefi != 0) {
			res.json(userContraDefi)
		} else {
			res.status(201).json({
				msg: `No medications found for this user`,
			})
		}
    } catch (error) {
        res.status(500).send({
            msg: `${error}. Contact Admin`,
        })
	}
}
