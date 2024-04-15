import { DataTypes } from 'sequelize'
import db from '../db'

import { Dbconstansts as Constants } from '../constants'

const UserWearableDataModel = db[Constants.database.users].define(
  Constants.tables.users.user_wearable_data,
  {
    user_wearable_data_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_wearables_id: {
      type: DataTypes.INTEGER,
    },
    date: {
      type: DataTypes.DATE,
    },
    sleep: {
      type: DataTypes.JSON,
    },
    activity: {
      type: DataTypes.JSON,
    },
    readiness: {
      type: DataTypes.JSON,
    },
    date_created: {
      type: DataTypes.DATE,
    },
    breathing: {
      type: DataTypes.JSON,
    },
    heart: {
      type: DataTypes.JSON,
    },
    spo2: {
      type: DataTypes.JSON,
    },
    temp_skin: {
      type: DataTypes.JSON,
    },
    temp_core: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default UserWearableDataModel
