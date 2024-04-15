import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const DashboardReference = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.dashboard_reference,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_group: {
      type: DataTypes.INTEGER,
    },
    health_number: {
      type: DataTypes.STRING,
    },
    id_question: {
      type: DataTypes.INTEGER,
    },
    answer_value: {
      type: DataTypes.STRING,
    },
    question_type: {
      type: DataTypes.STRING,
    },
    survey_bubbles: {
      type: DataTypes.STRING,
    },
    preset_ids: {
      type: DataTypes.STRING,
    },
    root_cause: {
      type: DataTypes.STRING,
    },
    tcm_root_cause: {
      type: DataTypes.STRING,
    },
    mad_libs_root_cause: {
      type: DataTypes.STRING,
    },
    health_score: {
      type: DataTypes.STRING,
    },
    mad_libs_suboptimal: {
      type: DataTypes.STRING,
    },
    constitution_id_insights: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: false,
  }
)

export default DashboardReference
