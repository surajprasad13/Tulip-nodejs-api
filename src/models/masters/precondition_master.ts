import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const PreconditionMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.precondition_master,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    precondition_id: {
      type: DataTypes.INTEGER,
    },
    precondition_name: {
      type: DataTypes.STRING,
    },
    precondition_synonyms: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default PreconditionMaster

