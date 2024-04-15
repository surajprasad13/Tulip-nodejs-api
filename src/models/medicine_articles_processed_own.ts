import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const MedicineArticlesProcessedOwn = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.medicine_articles_processed_own,
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

    is_accepted: {
      type: DataTypes.BOOLEAN,
    },

    min_age_group_range: {
      type: DataTypes.NUMBER,
    },

    max_age_group_range: {
      type: DataTypes.NUMBER,
    },

    gender: {
      type: DataTypes.STRING,
    },

    study_type: {
      type: DataTypes.STRING,
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
  },
  {
    timestamps: false,
  }
)

export default MedicineArticlesProcessedOwn
