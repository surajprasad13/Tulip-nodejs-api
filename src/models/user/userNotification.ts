import { DataTypes, ENUM } from "sequelize"
import { Dbconstansts as Constants } from "../../constants"
import db from "../../db"

const UserNotificationModel = db[Constants.database.users].define(
	Constants.tables.users.user_notification,
	{
		user_notification_id: {
			type: DataTypes.NUMBER,
		},
		notification_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
		},
		status: {
			type: DataTypes.ENUM("READ", "UNREAD"),
			defaultValue: "UNREAD",
		},
		time: {
			type: DataTypes.DATE,
		},
		notification_type: {
			type: ENUM("email", "sms", "push"),
		},
		lead_id: {
			type: DataTypes.INTEGER,
		},
	},
	{
		timestamps: false,
	}
)

export default UserNotificationModel
