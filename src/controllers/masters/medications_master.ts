import { Request, Response } from "express";
import MedicationsMaster from "../../models/masters/medications_master";

export const getMedicationsMaster = async (req: Request, res: Response) => {
  try {
    const info = await MedicationsMaster.findAll({
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
