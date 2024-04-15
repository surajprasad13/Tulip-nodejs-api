import { DataTypes, Sequelize } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const ResearchModel = db[Dbconstansts.database.defaultdb].define(
	Dbconstansts.tables.defaultdb.research,
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING,
		},
		description: {
			type: DataTypes.STRING,
		},
		image: {
			type: DataTypes.STRING,
		},
		created_at: {
			allowNull: false,
			defaultValue: db.now(),
			type: DataTypes.DATE,
		},
		updated_at: {
			allowNull: false,
			defaultValue: db.now(),
			type: DataTypes.DATE,
		},
	},
	{
		timestamps: false,
	}
)

export default ResearchModel
