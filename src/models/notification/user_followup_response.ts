import { DataTypes } from "sequelize"
import { Dbconstansts } from "../../constants"
import db from "../../db"

const UserfollowupResponseModel = db[Dbconstansts.database.users].define(
	Dbconstansts.tables.users.user_followup_response,
	{
		id: {
			type: DataTypes.INTEGER,
		},
		date_created: {
			type: DataTypes.DATE,
		},
		user_followup_id: {
			type: DataTypes.INTEGER,
		},
		response: {
			type: DataTypes.TEXT,
		},
	}
)

export default UserfollowupResponseModel
