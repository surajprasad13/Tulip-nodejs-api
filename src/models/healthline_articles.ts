import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const HealthLineArticles = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.healthline_articles,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    url: {
      type: DataTypes.STRING,
    },
    
    title: {
      type: DataTypes.STRING,
    },
    
    content: {
      type: DataTypes.STRING,
    },

    symptoms: {
      type: DataTypes.STRING,
    },

    treatments: {
      type: DataTypes.STRING,
    },

    is_analyzed: {
      type: DataTypes.INTEGER,
    },

    analyze_start_date: {
      type: DataTypes.DATE,
    },

    analyze_finish_date: {
      type: DataTypes.DATE,
    },

    gpt: {
      type: DataTypes.JSON,
    },
    gpt4: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default HealthLineArticles

