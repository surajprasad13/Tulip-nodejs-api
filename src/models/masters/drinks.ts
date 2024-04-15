import { DataTypes } from "sequelize";
import { Dbconstansts } from "../../constants";
import db from "../../db";

const Drinks = db[Dbconstansts.database.decision].define(
  Dbconstansts.tables.decision.drinks,
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    id_drink: {
      type: DataTypes.INTEGER,
    },

    name: {
      type: DataTypes.STRING,
    },

    description: {
      type: DataTypes.STRING,
    },

    ingredients_brand: {
      type: DataTypes.STRING,
    },

    directions: {
      type: DataTypes.STRING,
    },

    key_words: {
      type: DataTypes.STRING,
    },

    image_name: {
      type: DataTypes.STRING,
    },
    image_url: {
      type: DataTypes.STRING,
    },
    gpt_benefits: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
);

export default Drinks;
