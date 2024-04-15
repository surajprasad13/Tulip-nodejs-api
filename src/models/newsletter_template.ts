import { DataTypes} from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const NesletterTemplate = db[Dbconstansts.database.defaultdb].define(
	Dbconstansts.tables.defaultdb.newsletter_template,
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING,
		},
		subject: {
			type: DataTypes.STRING,
		},
		html: {
			type: DataTypes.STRING,
		},
		status: {
			type: DataTypes.ENUM("new", "to_send", "sent"),
			defaultValue: "new",
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

export default NesletterTemplate
