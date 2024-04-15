import { DataTypes } from "sequelize"
import db from "../db"

const QuestionsModel = db["decision"].define(
	"questions",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		group_id: {
			type: DataTypes.INTEGER,
		},
		id_question: {
			type: DataTypes.INTEGER,
		},
		id_tree: {
			type: DataTypes.INTEGER,
		},
		type: {
			type: DataTypes.STRING,
		},
		question: {
			type: DataTypes.STRING,
		},
		options: {
			type: DataTypes.JSON,
		},
		tags: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: false,
	}
)

export default QuestionsModel
