import { DataTypes } from "sequelize"
import db from "../db"

const RemediesExceptions = db["decision"].define(
	"remedies_exceptions",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		id_group: {
			type: DataTypes.INTEGER,
		},
		exception_type: {
			type: DataTypes.STRING,
		},
		exception_rule: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: false,
	}
)

export default RemediesExceptions
