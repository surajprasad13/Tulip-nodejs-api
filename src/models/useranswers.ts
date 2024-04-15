import { DataTypes } from "sequelize"
import db from "../db"

const UserAnswers = db["users"].define(
	"user_answers",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
		},
		lead_id: {
			type: DataTypes.INTEGER,
		},
		group_id: {
			type: DataTypes.INTEGER,
		},
		time: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		data: {
			type: DataTypes.JSON,
		},
		bubble_counters: {
			type: DataTypes.JSON,
		},
	},
	{
		timestamps: false,
	}
)

export default UserAnswers
