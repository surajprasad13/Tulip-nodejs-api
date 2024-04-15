import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomTreatments = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptom_treatments,
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
    articles: {
      type: DataTypes.JSON,
    },
    humata: {
      type: DataTypes.JSON,
    },
    summarized_data: {
      type: DataTypes.JSON,
    },
    dirty: {
      type: DataTypes.BOOLEAN,
    },    
  },
  {
    timestamps: false,
  }
)

export default SymptomTreatments
