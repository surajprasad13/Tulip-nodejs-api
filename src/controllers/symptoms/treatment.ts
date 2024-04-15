import UserTracker from "../../models/user/userTracker"
import SimptomTracker from "../../models/symptom_tracker"

export const getTreatment = async(id_symptom: number, id_track: number) => {
    try{
        const symptom = await SimptomTracker.findAll({
            raw: true,
            attributes: ['health_tip_title','health_tip_description'],
            where: {
                id_item: id_symptom
            },
        })
        const randomIndex = Math.floor(Math.random() * symptom.length)
        const randomTreatment = symptom[randomIndex]
        await UserTracker.update(
            { treatments: JSON.stringify(randomTreatment) },
            { where: { id: id_track } }
        )
        return randomTreatment
	} catch (error) {
        console.log(error)
        return {}
	}

}
