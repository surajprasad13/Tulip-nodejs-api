import { Request, Response } from "express"
import { getUserAnswers } from "../../utils/getUserAnswers"
import { getTaggedQuestions } from "../../utils/getTaggedQuestions"
import { getDashboardReference } from "../../utils/getDashboardReference"
import { getHealthScore } from "./getHealthScore"
import { getScales } from "./getScales"
import { getSubOptimal } from "./getSubOptimal"
import { getConstitutions } from "../../utils/getConstitutions"
import { getRootCauses } from "./getRootCauses"
import { getUserConstitution } from "./getUserConstitution"
import { getFreeLCDashboard } from "./getFreeLCDashboard"
import { getArticles } from "./getArticles"
import { getPresets } from "../../utils/getPresets"

export const getMainDashboard = async (req: Request, res: Response) => {
    const id = req.body.payload.user_id
	const id_group = req.body.group_id
    const tags: string[] = ['age','height','weight','scale_energy','scale_stress','scale_mood']

    const user_answers = await getUserAnswers(id,id_group)
    if(user_answers.length == 0){
        res.json({msg: "Answers for this user not found"})
        return
    }
    
    const dashboard_reference = await getDashboardReference(id_group)
    if(dashboard_reference.length == 0) {
        res.json({msg: "Dashboard Reference not found. Contact Admin"})
        return
    }

    if(id_group == 105) {
        const presets = await getPresets(105)
        const promise1 = new Promise(resolve => resolve(getFreeLCDashboard(user_answers, dashboard_reference)))
        const promise2 = new Promise(resolve => resolve(getArticles(user_answers, dashboard_reference, presets)))
        await Promise.all([promise1, promise2]).then((values: any) => {
            const response = {
                ...values[0],
                ...values[1]
            }
            res.json(response)
        }).catch((error: any) => {
            res.status(500).json({
                msg: `${error}. Contact Admin`,
            })
        })
        return
    }
    
    const questions = await getTaggedQuestions(tags,id_group)
    if(questions.length == 0) {
        res.json({msg: "Question tag not found. Contact Admin"})
        return
    }
    
    const constitutions = await getConstitutions(id_group)
    if(constitutions.length == 0) {
        res.json({msg: "Constitutions tables not found. Contact Admin"})
        return
    }

    const promise1 = new Promise(resolve => resolve(getHealthScore(user_answers, dashboard_reference)))
    const promise2 = new Promise(resolve => resolve(getScales(user_answers, questions)))
    const promise3 = new Promise(resolve => resolve(getRootCauses(user_answers, dashboard_reference)))
    const promise4 = new Promise(resolve => resolve(getSubOptimal(user_answers, dashboard_reference)))
    const promise5 = new Promise(resolve => resolve(getUserConstitution(user_answers, constitutions)))

    await Promise.all([promise1, promise2, promise3, promise4, promise5]).then((values: any) => {
        const response = {
            ...values[0],
            ...values[1],
            ...values[2],
            ...values[3],
            ...values[4]
        }
        res.json(response)
    }).catch((error: any) => {
        res.status(500).json({
            msg: `${error}. Contact Admin`,
        })
    })
    
}