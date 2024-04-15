import { Request, Response } from "express"
import MMPdf from "../../models/mm_pdf"

export const getMMPdf = async(req: Request, res: Response) => {
    try{
        const symptoms = req.body.symptoms
        const info = await MMPdf.findAll({
            raw: true,
            where: {
                symptom_id: symptoms
            },
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

