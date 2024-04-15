import { DataTypes } from "sequelize"
import { Dbconstansts } from "../../constants"
import db from "../../db"

const SubscriptionUserModel = db[Dbconstansts.database.users].define(Dbconstansts.tables.users.newsletter_subscription, {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	email: {
		type: DataTypes.STRING,
	},
	user_id: {
		type: DataTypes.INTEGER,
	},
	lead_id: {
		type: DataTypes.INTEGER,
	},
	active: {
		type: DataTypes.BOOLEAN,
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

export default SubscriptionUserModel
