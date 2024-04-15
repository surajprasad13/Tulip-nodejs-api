import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const RecipesMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.recipes_master,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_food: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    ingredients_brand: {
      type: DataTypes.STRING,
    },
    directions: {
      type: DataTypes.STRING,
    },
    key_words: {
      type: DataTypes.STRING,
    },
    image_name: {
      type: DataTypes.STRING,
    },
    image_url: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default RecipesMaster


