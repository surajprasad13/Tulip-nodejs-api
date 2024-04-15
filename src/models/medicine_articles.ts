import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const MedicineArticles = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.medicine_articles,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    pubmed_id: {
      type: DataTypes.INTEGER,
    },
    
    title: {
      type: DataTypes.STRING,
    },

    symptoms: {
      type: DataTypes.STRING,
    },

    treatments: {
      type: DataTypes.STRING,
    },

    preconditions: {
      type: DataTypes.STRING,
    },

    publication_date: {
      type: DataTypes.STRING,
    },

    url: {
      type: DataTypes.STRING,
    },

    all_text: {
      type: DataTypes.STRING,
    },

    short_text: {
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
    
    is_quality: {
      type: DataTypes.BOOLEAN,
    },

    gpt4: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: false,
  }
)

export default MedicineArticles
