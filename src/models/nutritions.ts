
import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const Nutritions = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.nutritions,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_group: {
      type: DataTypes.INTEGER,
    },
    preset_ids: {
      type: DataTypes.STRING,
    },
    introduction: {
      type: DataTypes.STRING,
    },
    madlibs: {
      type: DataTypes.STRING,
    },
    food_list: {
      type: DataTypes.STRING,
    },
    recipe: {
      type: DataTypes.STRING,
    },
    breakfast: {
      type: DataTypes.STRING,
    },
    lunch: {
      type: DataTypes.STRING,
    },
    dinner: {
      type: DataTypes.STRING,
    },
    snacks: {
      type: DataTypes.STRING,
    },
    desserts: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default Nutritions