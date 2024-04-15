import { Request, Response } from "express"
import { Op } from "sequelize"
import RecipesMaster from "../../models/masters/recipes_master"

export const getRecipesMaster = async(req: Request, res: Response) => {
    try{
        const food_id = req.body.food_id
        const info = await RecipesMaster.findAll({
            raw: true,
            where: {
                id_food: {
                    [Op.like]: `%${food_id}%` 
                }
            },
        });
		res.send({
            info
		})
	} catch (error) {
		res.status(500).json({
			msg: `${error}. Contact Admin`,
		})
	}
}
