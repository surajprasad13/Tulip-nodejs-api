import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomTreatmentsOwn = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptoms_treatments_own,
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
    articles_urls: {
      type: DataTypes.STRING,
    },
    key_roles: {
      type: DataTypes.STRING,
    },
    dosage: {
      type: DataTypes.STRING,
    },
    expected_improvement: {
      type: DataTypes.STRING,
    },
    articles: {
      type: DataTypes.JSON,
    },
    summarized_data: {
      type: DataTypes.JSON,
    },   
  },
  {
    timestamps: false,
  }
)

export default SymptomTreatmentsOwn
