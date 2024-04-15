import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const RemedyAlternatives = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.remedy_alternatives,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_group: {
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
    },
    remedy_type: {
      type: DataTypes.STRING,
    },
    brand: {
      type: DataTypes.STRING,
    },
    link_coupon_code: {
      type: DataTypes.STRING,
    },
    options: {
      type: DataTypes.JSON,
    },
    remedy_id: {
      type: DataTypes.INTEGER,
    },
    allergy_id: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default RemedyAlternatives
