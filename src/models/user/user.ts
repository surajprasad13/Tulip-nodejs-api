import { DataTypes } from "sequelize"
import db from "../../db"

import { Dbconstansts as Constants } from "../../constants"

const UserModel = db[Constants.database.users].define(
	Constants.tables.users.user,
	{
		user_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		stripe_user_id: {
			type: DataTypes.STRING,
		},
		email: {
			type: DataTypes.STRING,
		},
		password_hash: {
			type: DataTypes.STRING,
		},
		active: {
			type: DataTypes.INTEGER,
		},
		last_login: {
			type: DataTypes.DATE,
		},
		date_created: {
			type: DataTypes.DATE,
		},
		email_verified: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		user_type: {
			type: DataTypes.ENUM("OTP", "PASSWORD", "SOCIAL"),
			defaultValue: "OTP",
		},
		user_survey_status: {
			type: DataTypes.ENUM("NOT-STARTED", "INCOMPLETE", "COMPLETED"),
			defaultValue: "NOT-STARTED",
		},
		lead_id: {
			type: DataTypes.INTEGER,
		},
		otp: {
			type: DataTypes.STRING,
		},
		attempts: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
	},
	{
		timestamps: false,
	}
)

export default UserModel
