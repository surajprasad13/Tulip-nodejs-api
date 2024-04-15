import { DataTypes } from "sequelize"
import { Dbconstansts as Constants } from "../../constants"
import db from "../../db"

const UserOrdersModel = db[Constants.database.users].define(Constants.tables.users.user_orders, {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	product_id: {
		type: DataTypes.STRING,
		unique: true,
	},
	user_id: {
		type: DataTypes.INTEGER,
	},
	amount: {
		type: DataTypes.STRING,
	},
	stripeId: {
		type: DataTypes.STRING,
		defaultValue: null,
	},
	url: {
		type: DataTypes.STRING,
	},
	subscription: {
		type: DataTypes.STRING,
	},
	start_date: {
		type: DataTypes.DATE,
	},
	end_date: {
		type: DataTypes.DATE,
	},
	status: {
		type: DataTypes.ENUM("success", "fail", "wait", "paid", "unpaid", "no_payment_required", "canceled"),
		defaultValue: "wait",
	},
	createdAt: {
		type: DataTypes.DATE,
	},
	updatedAt: {
		type: DataTypes.DATE,
	},
})

export default UserOrdersModel
