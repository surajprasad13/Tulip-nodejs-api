
import Nutritions from "../models/nutritions"

export const getNutritions = async(group_id: number) => {
    const nutritions = await Nutritions.findAll({
		attributes: ['preset_ids','introduction','madlibs','food_list','recipe','breakfast','lunch','dinner','snacks','desserts'],
		raw: true,
		where: {
			id_group: group_id
		},
	}).catch((error: any) => {
		return []
	})
	
    if(!nutritions){
        return []
    }

    return nutritions 

}