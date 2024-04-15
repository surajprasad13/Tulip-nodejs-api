import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const MedicineArticlesForbidden = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.medicine_articles_forbidden,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pubmed_id: {
      type: DataTypes.INTEGER,
    },   
  },
  {
    timestamps: false,
  }
)

export default MedicineArticlesForbidden
