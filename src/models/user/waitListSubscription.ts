import { DataTypes } from "sequelize"
import { Dbconstansts } from "../../constants"
import db from "../../db"

const WaitListModel = db[Dbconstansts.database.users].define(Dbconstansts.tables.users.waitlist_subscription, {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING,
	},
	email: {
		type: DataTypes.STRING,
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

export default WaitListModel

