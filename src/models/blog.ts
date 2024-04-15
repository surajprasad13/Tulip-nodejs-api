import { DataTypes, Sequelize } from "sequelize"
import { Dbconstansts } from "../constants"
import db from "../db"

const BlogModel = db[Dbconstansts.database.defaultdb].define(
	Dbconstansts.tables.defaultdb.blogs,
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		category: {
			type: DataTypes.STRING,
		},
		title: {
			type: DataTypes.STRING,
		},
		description: {
			type: DataTypes.STRING,
		},
		views: {
			type: DataTypes.INTEGER,
		},
		image: {
			type: DataTypes.STRING,
		},
		published: {
			type: DataTypes.STRING,
		},
		created_at: {
			allowNull: false,
			defaultValue: db.now(),
			type: DataTypes.DATE,
		},
		updated_at: {
			allowNull: false,
			defaultValue: db.now(),
			type: DataTypes.DATE,
		},
		url: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: false,
	}
)

export default BlogModel
