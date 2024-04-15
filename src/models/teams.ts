import { DataTypes, Sequelize } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const TeamModel = db[Dbconstansts.database.defaultdb].define(
	Dbconstansts.tables.defaultdb.teams,
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
		},
		profession: {
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

export default TeamModel
