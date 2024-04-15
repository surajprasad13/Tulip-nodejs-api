import { Request, Response } from "express"
import MedicationsInfo from "../../models/medications_info"

export const getMedicationsInfo = async(req: Request, res: Response) => {
    try{
        const info = await MedicationsInfo.findOne({
            raw: true,
			where: {
				id_medication: req.query.id_medication??0
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

