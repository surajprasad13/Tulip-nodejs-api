import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const AyurvedicMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.ayurvedic_master,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    constitution: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
    group: {
      type: DataTypes.STRING,
    },
    treatment: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    instructions: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default AyurvedicMaster



