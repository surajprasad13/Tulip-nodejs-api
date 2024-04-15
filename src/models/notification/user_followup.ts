import { DataTypes, Sequelize } from "sequelize"
import { Dbconstansts } from "../../constants"
import db from "../../db"

const UserFollowupModel = db[Dbconstansts.database.users].define(
	Dbconstansts.tables.users.user_followup,
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
		},
		date_created: {
			type: DataTypes.DATE,
		},
		date_updated: {
			type: DataTypes.DATE,
		},
		date_sent: {
			type: DataTypes.DATE,
		},
		date_responded: {
			type: DataTypes.DATE,
		},
		followup_type_id: {
			type: DataTypes.INTEGER,
		},
	},
	{
		timestamps: false,
	}
)

export default UserFollowupModel
