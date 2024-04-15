import axios from "axios"
import { Request, Response } from "express"
import UserTracker from "../../models/user/userTracker"

export const getSymptomsInsights = async (req: Request, res: Response) => {
    try{
	    const id = req.body.payload.user_id
        const symptoms = await UserTracker.findAll({
            raw: true,
            where: {
                user_id: id
            },
        }) || 0
        if (symptoms == 0) {
			res.status(201).json({
				msg: `No symptoms found for this user`,
			})
            return
        }
		const config = {
			method: "post",
			url: "https://tulip-dev-stinsights-spec-y89e3.ondigitalocean.app/symptom-tracker",
			headers: {
				accept: "application/json",
				"Content-Type": "application/json",
			},
			data: {symptoms: symptoms},
		}
        let ml: any
		await axios(config).then((response: any) => {
            ml = response.data
        })
        res.json(ml)
	} catch (error: any) {
		res.status(201).json({
			msg: error,
		})
	}

}
