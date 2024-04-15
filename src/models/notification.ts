import { DataTypes } from "sequelize"
import { Dbconstansts as Constants } from "../constants"
import db from "../db"

const NotificationModel = db[Constants.database.users].define(
	Constants.tables.users.notifications,
	{
		notification_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		name: {
			type: DataTypes.STRING,
		},
		title_html: {
			type: DataTypes.STRING,
		},
		description_html: {
			type: DataTypes.STRING,
		},
		URL: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: false,
	}
)

export default NotificationModel
