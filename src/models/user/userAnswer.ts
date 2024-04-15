import { DataTypes } from "sequelize"
import db from "../../db"

import { Dbconstansts as Constants } from "../../constants"

const UserAnswerModel = db[Constants.database.users].define(
	Constants.tables.users.user_answers,
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
		},
		group_id: {
			type: DataTypes.INTEGER,
		},
		last_question: {
			type: DataTypes.INTEGER,
		},
		device_token: {
			type: DataTypes.STRING,
		},
		time: {
			type: DataTypes.TIME,
		},
		data: {
			type: DataTypes.JSON,
		},
	},
	{
		timestamps: false,
	}
)

export default UserAnswerModel
