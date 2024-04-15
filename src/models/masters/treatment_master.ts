import { DataTypes } from 'sequelize'
import { Dbconstansts } from '../../constants'
import db from '../../db'

const TreatmentMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.treatment_master,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    treatment_id: {
      type: DataTypes.INTEGER,
    },
    treatment_name: {
      type: DataTypes.STRING,
    },
    treatment_type: {
      type: DataTypes.STRING,
    },
    gpt_verb: {
      type: DataTypes.STRING,
    },
    treatment_synonyms: {
      type: DataTypes.STRING,
    },
    common_names: {
      type: DataTypes.STRING,
    },
    studies: {
      type: DataTypes.STRING,
    },
    categories: {
      type: DataTypes.STRING,
    },
    humata_synonyms: {
      type: DataTypes.STRING,
    },
    gpt_treatment_name: {
      type: DataTypes.STRING,
    },
    ayurvedic_name: {
      type: DataTypes.STRING,
    },
    chinese_name: {
      type: DataTypes.STRING,
    },
    constitution: {
      type: DataTypes.STRING,
    },
    ayurvedic_description: {
      type: DataTypes.STRING,
    },
    chinese_description: {
      type: DataTypes.STRING,
    },
    image_url: {
      type: DataTypes.STRING,
    },
    main_actions_id: {
      type: DataTypes.STRING,
    },
    supporting_actions_id: {
      type: DataTypes.STRING,
    },
    fullscript_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: false,
  }
)

export default TreatmentMaster


