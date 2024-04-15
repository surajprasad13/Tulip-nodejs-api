import { Request, Response } from "express"
import PreconditionMaster from "../../models/masters/precondition_master"

export const getPreconditionMaster = async(req: Request, res: Response) => {
    try{
        const info = await PreconditionMaster.findAll({
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



