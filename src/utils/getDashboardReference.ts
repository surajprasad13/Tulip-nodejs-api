import DashboardReference from "../models/dashboard_reference"

export const getDashboardReference = async(group_id: number) => {
    const dashboard = await DashboardReference.findAll({
		raw: true,
		where: {
			id_group: group_id
		},
	}).catch((error: any) => {
		console.log(error)
		return []
	})
	
    if(!dashboard){
        return []
    }

    return dashboard

}