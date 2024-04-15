import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomFoods = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptom_foods,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symptom_id: {
      type: DataTypes.INTEGER,
    },
    foods: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default SymptomFoods
