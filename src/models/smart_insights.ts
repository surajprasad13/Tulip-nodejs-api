import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SmartInsights = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.smart_insights,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symptom: {
      type: DataTypes.STRING,
    },
    treatments: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default SmartInsights 