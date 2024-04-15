import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const Presets = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.presets,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    preset_id: {
      type: DataTypes.INTEGER,
    },
    id_group: {
      type: DataTypes.INTEGER,
    },
    remedy_type: {
      type: DataTypes.STRING,
    },
    remedy_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: false,
  }
)

export default Presets
