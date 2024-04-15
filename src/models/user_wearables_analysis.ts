import { DataTypes } from "sequelize"
import db from "../db"

const UserWearableAnalysis = db["users"].define(
	"user_wearable_analysis",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
		},
		time: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		data: {
			type: DataTypes.JSON,
		},
	},
	{
		timestamps: false,
	}
)

export default UserWearableAnalysis