import { DataTypes } from "sequelize"
import db from "../db"

import { Dbconstansts as Constants } from "../constants"

const LeadModel = db[Constants.database.users].define(
	Constants.tables.users.lead,
	{
		lead_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		email: {
			type: DataTypes.STRING,
		},
		firstname: {
			type: DataTypes.STRING,
		},
		date_created: {
			type: DataTypes.DATE,
		},
		status: {
			type: DataTypes.STRING,
		},
		is_subscription: {
			type: DataTypes.ENUM("T", "F"),
			defaultValue: "F",
		},
	},
	{
		timestamps: false,
	}
)

export default LeadModel
