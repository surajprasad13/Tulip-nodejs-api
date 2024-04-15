import { Op } from 'sequelize'; // asegúrate de importar Op de sequelize
import ConstitutionTextMaster from "../models/masters/constitution_text_master"

export const getConstitutionText = async(constitutions: number[]) => {

    try {
        const orConditions = constitutions.map(constitution => ({
            constitution: {
                [Op.like]: `%${constitution}%`
            }
        }))

        const constitution_text = await ConstitutionTextMaster.findAll({
            attributes: ['constitution', 'name', 'section', 'text'],
            raw: true,
            where: {
                [Op.or]: orConditions
            },
        })

        if(!constitution_text){
            return []
        }

        return constitution_text

    } catch(error: any) {
        console.log(error)
        return []
    }
}
