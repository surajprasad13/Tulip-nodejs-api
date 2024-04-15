import { DataTypes } from "sequelize"
import db from "../db"

const Medications = db["decision"].define(
	"medications",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		drug_class: {
			type: DataTypes.STRING,
		},
		drug_sub_class: {
			type: DataTypes.STRING,
		},
		brand_name: {
			type: DataTypes.STRING,
		},
		generic_name: {
			type: DataTypes.STRING,
		},
		nutrients_depleted: {
			type: DataTypes.STRING,
		},
		cm: {
			type: DataTypes.INTEGER,
		},
		supplement_contraindications: {
			type: DataTypes.STRING,
		},
		food_contraindications: {
			type: DataTypes.STRING,
		}
	},
	{
		timestamps: false,
	}
)

export default Medications
