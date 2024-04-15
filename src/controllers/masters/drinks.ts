import { Request, Response } from "express";
import Drinks from "../../models/masters/drinks";

export const getDrinks = async (req: Request, res: Response) => {
  try {
    const info = await Drinks.findAll({
      raw: true,
    });
    res.send({
      info,
    });
  } catch (error) {
    res.status(500).json({
      msg: `${error}. Contact Admin`,
    });
  }
};
