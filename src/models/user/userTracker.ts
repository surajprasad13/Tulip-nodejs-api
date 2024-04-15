import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const UserTracker = db[Dbconstansts.database.users].define(
  Dbconstansts.tables.users.user_tracker,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id:{
      type: DataTypes.INTEGER,
    },
    symptom: {
      type: DataTypes.INTEGER,
    },
    start_date: {
      type: DataTypes.DATE,
    },
    duration: {
      type: DataTypes.INTEGER,
    },
    severity: {
      type: DataTypes.INTEGER,
    },
    triggers: {
      type: DataTypes.STRING,
    },
    treatments: {
      type: DataTypes.JSON,
    },
    medications: {
      type: DataTypes.STRING,
    },
    stress_level: {
      type: DataTypes.INTEGER,
    },
    notes: {
      type: DataTypes.STRING,
    },
    treatments_tried: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default UserTracker