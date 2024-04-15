import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const MessageCypress = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.message_cypress,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    processId: {
      type: DataTypes.INTEGER,
    },
    question: {
      type: DataTypes.STRING,
    },
    answer: {
      type: DataTypes.STRING,
    },    
    folder: {
      type: DataTypes.STRING,
    },
    aux_data: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default MessageCypress
