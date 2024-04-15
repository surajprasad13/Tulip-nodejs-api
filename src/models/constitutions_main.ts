import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const ConstitutionsMain = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.constitutions_main,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    constitution_id: {
      type: DataTypes.INTEGER,
    },
    constitution: {
      type: DataTypes.STRING,
    },
    information_to_show: {
      type: DataTypes.STRING,
    },
    id_group: {
      type: DataTypes.INTEGER,
    },
    foods_to_increase: {
      type: DataTypes.STRING,
    },
    foods_to_decrease: {
      type: DataTypes.STRING,
    },
    shopping_list: {
      type: DataTypes.STRING,
    },
    preset_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: false,
  }
)

export default ConstitutionsMain
