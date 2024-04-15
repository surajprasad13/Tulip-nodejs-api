import { Request, Response } from "express"
import MedicationsInfoLightweight from "../../models/medications_info_lightweight"

export const getMedicationsInfoLightweight = async(req: Request, res: Response) => {
    try{
        const info = await MedicationsInfoLightweight.findAll({
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

