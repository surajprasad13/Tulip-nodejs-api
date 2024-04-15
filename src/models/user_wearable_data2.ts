import { DataTypes } from 'sequelize'
import db from '../db'

import { Dbconstansts as Constants } from '../constants'

const UserWearableData2Model = db[Constants.database.users].define(
  Constants.tables.users.user_wearable_data2,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    wearable_id: {
      type: DataTypes.INTEGER,
    },
    date_created: {
      type: DataTypes.DATE,
    },
    date_request_start: {
      type: DataTypes.DATE,
    },
    date_request_end: {
      type: DataTypes.DATE,
    },
    raw_data: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default UserWearableData2Model
