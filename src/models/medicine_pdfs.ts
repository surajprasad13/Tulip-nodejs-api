import { DataTypes} from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const MedicinePdfs = db[Dbconstansts.database.decision].define(
	Dbconstansts.tables.decision.medicine_pdfs,
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING,
		},
		content: {
			type: DataTypes.STRING,
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: db.now(),
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: db.now(),
		},
	}
)

export default MedicinePdfs

