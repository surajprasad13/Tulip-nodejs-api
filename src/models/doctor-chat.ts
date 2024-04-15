import { DataTypes } from 'sequelize'
import db from '../db'

import { Dbconstansts as Constants } from '../constants'

const DoctorChatModel = db[Constants.database.users].define(
  Constants.tables.users.doctor_chat,
  {
    doctor_chat_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
    },
    last_client_message_sent_at: {
      type: DataTypes.DATE,
    },
    last_doctor_message_sent_at: {
      type: DataTypes.DATE,
    },
    doctor_unread_messages: {
      type: DataTypes.INTEGER,
    },
    doctor_unreplied_messages: {
      type: DataTypes.INTEGER,
    },
    client_unread_messages: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: false,
  }
)

export default DoctorChatModel
