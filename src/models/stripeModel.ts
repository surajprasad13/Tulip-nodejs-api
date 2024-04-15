import { DataTypes } from "sequelize"
import { Dbconstansts as Constants } from "../constants"
import db from "../db"

const StripeModel = db[Constants.database.decision].define(
	Constants.tables.decision.plans,
	{
		id: {
			type: DataTypes.STRING,
			primaryKey: true,
			unique: true,
		},
		group_id: {
			type: DataTypes.NUMBER,
		},
		name: {
			type: DataTypes.STRING,
		},
		price: {
			type: DataTypes.STRING,
		},
		priceLabel: {
			type: DataTypes.STRING,
		},
		description: {
			type: DataTypes.STRING,
		},
		image: {
			type: DataTypes.STRING,
		},
		start_date: {
			type: DataTypes.DATEONLY,
		},
		end_date: {
			type: DataTypes.DATEONLY,
		},
		coupon_code: {
			type: DataTypes.JSON,
		},
		type: {
			type: DataTypes.STRING,
		},
		url: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: false,
	}
)

export default StripeModel
