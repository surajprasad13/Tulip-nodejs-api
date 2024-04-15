import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const Allergies = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.allergies,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    allergy_id: {
      type: DataTypes.INTEGER,
    },
    allergy_type: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default Allergies
