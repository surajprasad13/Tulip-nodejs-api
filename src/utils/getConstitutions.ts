import DashboardReference from "../models/dashboard_reference"
import ConstitutionsMain from "../models/constitutions_main"

export const getConstitutions = async(group_id: number) => {

    DashboardReference.hasOne(ConstitutionsMain, {sourceKey: 'constitution_id_insights', foreignKey : 'constitution_id'})
    ConstitutionsMain.belongsTo(DashboardReference, {foreignKey : 'constitution_id'})

    const constitutions = await DashboardReference.findAll({
        raw: true,
        where:{
            id_group:group_id
        }, 
        attributes: ['health_number','id_question','answer_value'],
        include:{
            model:ConstitutionsMain,
            attributes: ['constitution','information_to_show','foods_to_increase','foods_to_decrease','shopping_list','preset_id'],
        }
    }).catch((error: any) => {
		return []
	})

    if(!constitutions) {
        return []
    }
    return constitutions

}