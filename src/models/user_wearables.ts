import { DataTypes } from 'sequelize'
import db from '../db'

import { Dbconstansts as Constants } from '../constants'

const UserWearablesModel = db[Constants.database.users].define(
  Constants.tables.users.user_wearables,
  {
    user_wearables_id: {
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
    wearable_status: {
      type: DataTypes.ENUM('NOT-CONNECTED', 'CONNECTED'),
      defaultValue: 'NOT-CONNECTED',
    },
    token: {
      type: DataTypes.STRING,
    },
    date_created: {
      type: DataTypes.DATE,
    },
    date_updated: {
      type: DataTypes.DATE,
    },
    user_info: {
      type: DataTypes.JSON,
    },
    fitbit_base_64_encode: {
      type: DataTypes.STRING,
    },
    fitbit_code_verifier: {
      type: DataTypes.STRING,
    },
    fitbit_code_challenge: {
      type: DataTypes.STRING,
    },
    fitbit_user_id: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default UserWearablesModel
