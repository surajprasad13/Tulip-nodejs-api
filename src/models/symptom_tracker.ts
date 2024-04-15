import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomTracker = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptom_tracker,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_item: {
      type: DataTypes.INTEGER,
    },
    category: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    health_tip_title: {
      type: DataTypes.STRING,
    },
    health_tip_description: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default SymptomTracker 