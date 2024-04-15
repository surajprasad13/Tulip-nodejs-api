import { DataTypes } from "sequelize"
import db from "../db"

const RemediesExceptions = db["decision"].define(
	"remedies_alternatives",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		id_group: {
			type: DataTypes.INTEGER,
		},
        name: {
			type: DataTypes.STRING,
		},
		options: {
			type: DataTypes.JSON,
		},
        remedy_type: {
			type: DataTypes.STRING,
		},
		brand: {
			type: DataTypes.STRING,
		},
		link_coupon_code: {
			type: DataTypes.STRING,
		},
		remedy_id: {
			type: DataTypes.INTEGER,
		}
	},
	{
		timestamps: false,
	}
)

export default RemediesExceptions