import { DataTypes } from "sequelize"
import db from "../../db"

import { Dbconstansts as Constants } from "../../constants"

const AdminRolesModel = db[Constants.database.users].define(
	Constants.tables.users.admin_roles,
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
		},
		jwt_claim: {
			type: DataTypes.STRING,
		},
		description: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: false,
	}
)

export default AdminRolesModel
