import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const ConstitutionTextMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.constitution_text_master,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_group: {
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
    },
    section: {
      type: DataTypes.STRING,
    },
    constitution: {
      type: DataTypes.STRING,
    },
    text: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default ConstitutionTextMaster


