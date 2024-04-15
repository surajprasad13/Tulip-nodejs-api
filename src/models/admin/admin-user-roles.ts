import { DataTypes } from "sequelize"
import db from "../../db"

import { Dbconstansts as Constants } from "../../constants"

const AdminUserRolesModel = db[Constants.database.users].define(
	Constants.tables.users.admin_user_roles,
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		admin_user_id: {
			type: DataTypes.INTEGER,
		},
		admin_role_id: {
			type: DataTypes.INTEGER,
		},
	},
	{
		timestamps: false,
	}
)

export default AdminUserRolesModel
