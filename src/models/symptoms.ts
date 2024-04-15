import { DataTypes } from "sequelize"
import db from "../db"

const Symptoms = db["decision"].define(
	"symptoms",
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
		key_phrases: {
			type: DataTypes.STRING,
		},
		main_symptom: {
			type: DataTypes.STRING,
		},
        sub_symptoms: {
			type: DataTypes.STRING,
		},
		frequency: {
			type: DataTypes.STRING,
		}
	},
	{
		timestamps: false,
	}
)

export default Symptoms