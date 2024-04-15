import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const RootCauseInsights = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.root_cause_insights,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    group_id: {
      type: DataTypes.INTEGER,
    },
    title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    studies: {
      type: DataTypes.JSON,
    },
    image_url: {
			type: DataTypes.STRING,
		},
  },
  {
    timestamps: false,
  }
)

export default RootCauseInsights
