import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../constants'
import db from '../db'

const SymptomConditionMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.symptom_condition_master,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symptom_id: {
      type: DataTypes.INTEGER,
    },
    symptom_name: {
      type: DataTypes.STRING,
    },
    symptom_type: {
      type: DataTypes.STRING,
    },    
    subsymptom_of: {
      type: DataTypes.INTEGER,
    },
    info: {
      type: DataTypes.JSON,
    },
    summarized_info: {
      type: DataTypes.STRING,
    },
    symptoms: {
      type: DataTypes.STRING,
    },
    dont_extract_treatments: {
      type: DataTypes.INTEGER,
    },
    diagnose_algorithm_replace: {
      type: DataTypes.STRING,
    },    
    main_actions_symptoms_id: {
      type: DataTypes.STRING,
    }, 
    supporting_actions_id: {
      type: DataTypes.STRING,
    }, 
    categories_vitamins: {
      type: DataTypes.STRING,
    }, 
    id_nutrition_guidelines: {
      type: DataTypes.INTEGER,
    },
    synonyms: {
      type: DataTypes.STRING,
    }, 
  },
  {
    timestamps: false,
  }
)

export default SymptomConditionMaster
