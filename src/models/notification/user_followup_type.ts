import { DataTypes } from "sequelize"
import { Dbconstansts } from "../../constants"
import db from "../../db"

const UserfollowupTypeModel = db[Dbconstansts.database.users].define(Dbconstansts.tables.users.user_followup_type, {
	id: {
		type: DataTypes.INTEGER,
	},
	description: {
		type: DataTypes.STRING,
	},
	date_created: {
		type: DataTypes.DATE,
	},
	date_updated: {
		type: DataTypes.DATE,
	},
})

export default UserfollowupTypeModel
