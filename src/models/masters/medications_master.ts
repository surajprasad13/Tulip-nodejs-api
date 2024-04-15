import { DataTypes } from "sequelize";
import { Dbconstansts } from "../../constants";
import db from "../../db";

const MedicationsMaster = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.medications_master,
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
    nutrients_depleted: {
      type: DataTypes.STRING,
    },
    herb_supplements_contraindications: {
      type: DataTypes.STRING,
    },
    foods_drinks_contraindications: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
);

export default MedicationsMaster;
