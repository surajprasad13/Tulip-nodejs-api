import { DataTypes } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const TestimonialModel = db[Dbconstansts.database.defaultdb].define(
	Dbconstansts.tables.defaultdb.testimonials,
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		date_created: {
			null: false,
			type: DataTypes.DATE
		},
		date_updated: {
			null: false,
			type: DataTypes.DATE
		},
		user_id: {
			null: true,
			type: DataTypes.INTEGER,
		},
		name: {
			type: DataTypes.STRING,
		},
		description: {
			type: DataTypes.STRING,
		},
		profession: {
			type: DataTypes.STRING,
		},
		image: {
			type: DataTypes.STRING,
		},
		group_id: {
			null: true,
			type: DataTypes.INTEGER
		},
		is_deleted: {
			null: false,
			type: DataTypes.BOOLEAN
		}
	},
	{
		timestamps: false,
	}
)

export default TestimonialModel
