import { DataTypes } from "sequelize"
import { Dbconstansts as Constants } from "../../constants"
import db from "../../db"

const UserProfileModel = db[Constants.database.users].define(
	Constants.tables.users.user_profile,
	{
		user_profile_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
			unique: true,
		},
		first_name: {
			type: DataTypes.STRING,
		},
		last_name: {
			type: DataTypes.STRING,
		},
		sex: {
			type: DataTypes.ENUM("M", "F"),
		},
		dob: {
			type: DataTypes.DATE,
		},
		phone: {
			type: DataTypes.STRING,
		},
		address_line1: {
			type: DataTypes.STRING,
		},
		address_line2: {
			type: DataTypes.STRING,
		},
		address_city: {
			type: DataTypes.STRING,
		},
		address_zip: {
			type: DataTypes.STRING,
		},
		address_state: {
			type: DataTypes.STRING,
		},
		address_country: {
			type: DataTypes.STRING,
		},
		communication_preference: {
			type: DataTypes.STRING,
		},
		timezone: {
			type: DataTypes.STRING,
		},
		device_tokens: {
			type: DataTypes.STRING,
		},
		data: {
			type: DataTypes.JSON,
		},
		profile_image: {
			type: DataTypes.STRING,
		},
		time: {
			type: DataTypes.TIME,
		},
		isLabUser: {
			type: DataTypes.BOOLEAN,
		}
	},
	{
		timestamps: false,
	}
)

export default UserProfileModel
