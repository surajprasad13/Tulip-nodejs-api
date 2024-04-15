import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const CustomRecommendations = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.custom_recommendations,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symptom_id: {
      type: DataTypes.INTEGER,
    },
    treatments: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default CustomRecommendations
