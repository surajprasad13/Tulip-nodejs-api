import { DataTypes } from "sequelize"
import db from "../db"

const QuestionRemedies = db["decision"].define(
	"question_remedies",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		id_group: {
			type: DataTypes.INTEGER,
		},
		id_question: {
			type: DataTypes.INTEGER,
		},
		answer_value: {
			type: DataTypes.STRING,
		},
		exception: {
			type: DataTypes.STRING,
		},
		remedy_type: {
			type: DataTypes.STRING,
		},
		remedy_id: {
			type: DataTypes.INTEGER,
		},
		weight: {
			type: DataTypes.INTEGER,
		},
	},
	{
		timestamps: false,
	}
)

export default QuestionRemedies
