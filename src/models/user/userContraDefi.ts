import { DataTypes } from "sequelize"
import { Dbconstansts } from "../../constants"
import db from "../../db"

const UserContraDefiModel = db[Dbconstansts.database.users].define(Dbconstansts.tables.users.user_contra_defi, {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	user_id: {
		type: DataTypes.INTEGER,
	},
	data: {
		type: DataTypes.JSON,
	},
	createdAt: {
		type: DataTypes.DATE,
		defaultValue: db.now(),
	},
	updatedAt: {
		type: DataTypes.DATE,
		defaultValue: db.now(),
	},
})

export default UserContraDefiModel


