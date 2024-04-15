import { DataTypes } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const UserImage = db[Dbconstansts.database.users].define(
	Dbconstansts.tables.users.user_image,
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		date_created: {
			null: false,
			type: DataTypes.DATE
		},
		user_id: {
			null: true,
			type: DataTypes.INTEGER,
		},
		object_key: {
			type: DataTypes.STRING,
		},
		image_type: {
			type: DataTypes.STRING,
		},
		is_deleted: {
			null: false,
			type: DataTypes.BOOLEAN
		}
	},
	{
		timestamps: false,
	}
)

export default UserImage
