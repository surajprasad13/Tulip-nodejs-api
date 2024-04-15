import { DataTypes } from 'sequelize'
import db from '../../db'

import { Dbconstansts as Constants } from '../../constants'

const AdminUserModel = db[Constants.database.users].define(
  Constants.tables.users.admin_user,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password_hash: {
      type: DataTypes.STRING,
    },
    designation: {
      type: DataTypes.STRING,
    },
    profile_image: {
      type: DataTypes.STRING,
    },
    firebase_uid: {
      type: DataTypes.STRING,
    },
    push_subscription: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default AdminUserModel
