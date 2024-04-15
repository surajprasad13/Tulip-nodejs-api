import { DataTypes} from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const ResearchSubscription = db[Dbconstansts.database.users].define(
	Dbconstansts.tables.users.research_subscription,
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		first_name: {
			type: DataTypes.STRING,
		},
		last_name: {
			type: DataTypes.STRING,
		},
		email: {
			type: DataTypes.STRING,
		},
		details: {
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

export default ResearchSubscription