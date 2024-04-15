import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomTreatmentsAvoid = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptoms_treatments_avoid,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    treatment_id: {
      type: DataTypes.INTEGER,
    },
    treatment_name: {
      type: DataTypes.STRING,
    },
    symptom_id: {
      type: DataTypes.INTEGER,
    },
    symptom_name: {
      type: DataTypes.STRING,
    },
    condition_id: {
      type: DataTypes.INTEGER,
    },
    condition_name: {
      type: DataTypes.STRING,
    },  
  },
  {
    timestamps: false,
  }
)

export default SymptomTreatmentsAvoid
