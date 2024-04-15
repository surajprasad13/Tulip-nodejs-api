import { DataTypes } from 'sequelize'
import db from '../db'

import { Dbconstansts as Constants } from '../constants'

const DoctorChatMessagesModel = db[Constants.database.users].define(
  Constants.tables.users.doctor_chat_messages,
  {
    doctor_chat_message_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doctor_chat_id: {
      type: DataTypes.INTEGER,
    },
    text: {
      type: DataTypes.TEXT,
    },
    attachment: {
      type: DataTypes.STRING,
    },
    sent_at: {
      type: DataTypes.DATE,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
    },
    replied_to: {
      type: DataTypes.INTEGER,
    },
    read: {
      type: DataTypes.BOOLEAN,
    },
    replied: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    timestamps: false,
  }
)

export default DoctorChatMessagesModel
