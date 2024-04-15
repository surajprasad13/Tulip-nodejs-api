import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const GptLog = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.gpt_log,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    messages: {
      type: DataTypes.JSON,
    },  
    response: {
      type: DataTypes.JSON,
    },  
    tokens: {
      type: DataTypes.INTEGER,
    },      
    createdAt: {
      type: DataTypes.TIME,
    }, 
    error: {
      type: DataTypes.JSON,
    },  
  },
  {
    timestamps: false,
  }
)

export default GptLog
