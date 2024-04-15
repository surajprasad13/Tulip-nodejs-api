import { DataTypes} from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const MMPdf = db[Dbconstansts.database.decision].define(
	Dbconstansts.tables.decision.mm_pdf,
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		symptom_id: {
			type: DataTypes.INTEGER,
		},
		supplement: {
			type: DataTypes.STRING,
		},
		foods_to_increase: {
			type: DataTypes.STRING,
		},
		foods_to_decrease: {
			type: DataTypes.STRING,
		},
		lifestyle: {
			type: DataTypes.STRING,
		},
		root_cause: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: false,
	}
)

export default MMPdf


