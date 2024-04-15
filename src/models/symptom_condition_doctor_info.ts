import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomConditionDoctorInfo = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptom_condition_doctor_info,
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
    symptom_type: {
      type: DataTypes.STRING,
    },    
    data: {
      type: DataTypes.JSON,
    },  
    summarized_info: {
      type: DataTypes.JSON,
    },  
    createdAt: {
      type: DataTypes.TIME,
    },
    updatedAt: {
      type: DataTypes.TIME,
    },
  },
  {
    timestamps: false,
  }
)

export default SymptomConditionDoctorInfo
