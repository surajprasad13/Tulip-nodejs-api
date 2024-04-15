import { DataTypes } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const AskExpertQuestionsAnswersModel = db[Dbconstansts.database.defaultdb].define(
	Dbconstansts.tables.defaultdb.ask_expert_questions_answers,
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		category: {
			type: DataTypes.STRING,
		},
		question: {
			type: DataTypes.STRING,
		},
		answer: {
			type: DataTypes.STRING,
		},
		is_initial_dataset: {
			type: DataTypes.BOOLEAN,
		},
		is_visible: {
			type: DataTypes.BOOLEAN,
		},
		createdAt: {
			type: DataTypes.DATE,
		},
		updatedAt: {
			type: DataTypes.BOOLEAN,
		},
		user_id: {
			type: DataTypes.INTEGER,
		},
	},
	{
		timestamps: false,
	}
)

export default AskExpertQuestionsAnswersModel
