import Presets from "../models/presets"

export const getPresets = async(group_id: number) => {
    const presets = await Presets.findAll({
		attributes: ['preset_id','remedy_type','remedy_id'],
		raw: true,
		where: {
			id_group: group_id
		},
	}).catch((error: any) => {
		return []
	})
	
    if(!presets){
        return []
    }

    return presets

}