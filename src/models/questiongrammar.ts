import { DataTypes } from "sequelize"
import db from "../db"

const QuestionGrammar = db["decision"].define(
	"question_grammar",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		id_group: {
			type: DataTypes.INTEGER,
		},
        health_number: {
			type: DataTypes.STRING,
		},
		id_question: {
			type: DataTypes.INTEGER,
		},
		answer_value: {
			type: DataTypes.STRING,
		},
		populate: {
			type: DataTypes.STRING
		},
	},
	{
		timestamps: false,
	}
)

export default QuestionGrammar