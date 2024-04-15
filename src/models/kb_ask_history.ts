import { DataTypes } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const KbAskHistory = db[Dbconstansts.database.users].define(
	Dbconstansts.tables.users.kb_ask_history,
	{
		"id": {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		"user_id": {
			type: DataTypes.INTEGER
		},
		"question": {
			type: DataTypes.STRING
		},
		"answer": {
			type: DataTypes.STRING
		},
		"date_created": {
			type: DataTypes.DATE
		}
	},
	{
		timestamps: false,
	}
)

export default KbAskHistory
