import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const MedicineArticlesApprovedShortText = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.medicine_articles_approved_short_text,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    pubmed_id: {
      type: DataTypes.INTEGER,
    },

    short_text: {
      type: DataTypes.STRING,
    },

  },
  {
    timestamps: false,
  }
)

export default MedicineArticlesApprovedShortText
