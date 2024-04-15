import { DataTypes, Sequelize } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const ContactModel = db[Dbconstansts.database.defaultdb].define(Dbconstansts.tables.defaultdb.contact, {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	type: {
		type: DataTypes.ENUM("contact", "inquiry"),
		defaultValue: "contact",
	},
	name: {
		type: DataTypes.STRING,
	},
	email: {
		type: DataTypes.STRING,
	},
	phone_number: {
		type: DataTypes.STRING,
	},
	message: {
		type: DataTypes.STRING,
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: db.now(),
	},
	updatedAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: db.now(),
	},
})

export default ContactModel
