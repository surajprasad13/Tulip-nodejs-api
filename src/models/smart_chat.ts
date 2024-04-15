import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SmartChat = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.smart_chat,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.INTEGER,
    },   
    messages: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default SmartChat
