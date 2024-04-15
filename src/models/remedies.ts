import { DataTypes } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const Remedies = db[Dbconstansts.database.decision].define(
	Dbconstansts.tables.decision.remedies,
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
		remedy_type: {
			type: DataTypes.STRING,
		},
		brand: {
			type: DataTypes.STRING,
		},
		link_coupon_code: {
			type: DataTypes.STRING,
		},
		options: {
			type: DataTypes.JSON,
		},
		remedy_id: {
			type: DataTypes.INTEGER,
		},
		image_url: {
			type: DataTypes.STRING,
		},
		allergy_id: {
			type: DataTypes.STRING,
		}
	},
	{
		timestamps: false,
	}
)

export default Remedies
