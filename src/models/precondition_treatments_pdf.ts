import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const PreconditionTreatmentsPdf = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.precondition_treatments_pdf,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    precondition_id: {
      type: DataTypes.INTEGER,
    },
    treatments_ids: {
      type: DataTypes.STRING,
    },
    prioritized_treatments: {
      type: DataTypes.STRING,
    },
    dosage: {
      type: DataTypes.STRING,
    },
    additional_information: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
)

export default PreconditionTreatmentsPdf
