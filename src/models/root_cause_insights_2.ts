import { DataTypes } from "sequelize"
import db from "../db"

const RootCauseInsights2 = db["decision"].define(
	"root_cause_insights_2",
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
		root_cause: {
			type: DataTypes.STRING
		},
        tcm_diagnosis: {
			type: DataTypes.STRING
		},
        health_score: {
			type: DataTypes.INTEGER,
		},
        mad_libs: {
			type: DataTypes.STRING
		},
	},
	{
		timestamps: false,
	}
)

export default RootCauseInsights2