import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const SymptomMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptom_master,
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
    show: {
      type: DataTypes.BOOLEAN,
    },
    categories: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default SymptomMaster
