import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomTreatmentsPdf = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptom_treatments_pdf,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symptom_id: {
      type: DataTypes.INTEGER,
    },
    treatments_ids: {
      type: DataTypes.STRING,
    },
    prioritized_treatments: {
      type: DataTypes.STRING,
    },
    dosage: {
      type: DataTypes.STRING,
    },
    additional_information: {
      type: DataTypes.STRING,
    },
    expected_improvement: {
      type: DataTypes.STRING,
    },
    key_roles: {
      type: DataTypes.STRING,
    },
    citation: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default SymptomTreatmentsPdf
