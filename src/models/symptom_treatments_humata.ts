import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomTreatmentsHumata = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptom_treatments_humata,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    humata_folder: {
      type: DataTypes.STRING,
    },
    treatments: {
      type: DataTypes.JSON,
    },
    nonindexed_symptoms: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default SymptomTreatmentsHumata
