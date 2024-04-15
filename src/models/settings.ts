import { DataTypes } from 'sequelize'
import db from '../db'

import { Dbconstansts as Constants } from '../constants'

const SettingsModel = db[Constants.database.defaultdb].define(
  Constants.tables.defaultdb.settings,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
    },
    data: {
      type: DataTypes.JSON,
    },    
  },
  {
    timestamps: false,
  }
)

export default SettingsModel