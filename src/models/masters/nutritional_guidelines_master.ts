import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const NutritionalGuidelinesMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.nutritional_guidelines_master,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nutrition_guidelines_id: {
      type: DataTypes.INTEGER,
    },
    nutrition_guidelines_name: {
      type: DataTypes.STRING,
    },
    plan_information: {
      type: DataTypes.STRING,
    },
    tips_for_success: {
      type: DataTypes.STRING,
    },
    sample_meal_plan: {
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

export default NutritionalGuidelinesMaster


