import { DataTypes } from 'sequelize'
import db from '../db'

import { Dbconstansts as Constants } from '../constants'

const SurveyConfigurationModel = db[Constants.database.decision].define(
  Constants.tables.decision.survey_configuration,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    group_id: {
      type: DataTypes.INTEGER,
    },
    sentiment: {
      type: DataTypes.STRING,
    },
    template: {
      type: DataTypes.STRING,
    },
    date_created: {
      type: DataTypes.DATE,
    },
    GPT3_responses: {
      type: DataTypes.JSON,
    },
    key: {
      type: DataTypes.STRING,
    }
  },
  {
    timestamps: false,
  }
)

export default SurveyConfigurationModel
