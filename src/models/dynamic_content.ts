import { DataTypes } from "sequelize"
import db from "../db"

const DynamicContent = db["decision"].define(
	"dynamic_content",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		id_group: {
			type: DataTypes.INTEGER,
		},
        id_section: {
			type: DataTypes.INTEGER,
		},
		content: {
			type: DataTypes.STRING
		},
		sectionName: {
			type: DataTypes.STRING
		},
	},
	{
		timestamps: false,
	}
)

export default DynamicContent