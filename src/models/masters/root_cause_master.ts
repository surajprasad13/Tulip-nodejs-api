import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const RootCauseMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.root_cause_master,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symptom_id: {
      type: DataTypes.INTEGER,
    },
    root_cause: {
      type: DataTypes.STRING,
    },
    summary: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default RootCauseMaster



