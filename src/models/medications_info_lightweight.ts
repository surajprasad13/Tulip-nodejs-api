import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const MedicationsInfoLightweight = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.medications_info_lightweight,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_medication: {
      type: DataTypes.INTEGER,
    },
    brand_name: {
			type: DataTypes.STRING,
		},
		generic_name: {
			type: DataTypes.STRING,
		},  
    gpt4: {
      type: DataTypes.JSON,
    },  
    gpt3: {
      type: DataTypes.JSON,
    },
    summarized_info: {
      type: DataTypes.JSON,
    },  
    createdAt: {
      type: DataTypes.TIME,
    },
    updatedAt: {
      type: DataTypes.TIME,
    },
  },
  {
    timestamps: false,
  }
)

export default MedicationsInfoLightweight
