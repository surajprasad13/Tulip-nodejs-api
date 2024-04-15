import { Request, Response } from "express";
import { Op } from "sequelize";
import MedicineArticlesOwn from "../../models/medicine_articles_own";

export const getMedicineArticlesOwn = async (req: Request, res: Response) => {
  try {
    const symptomsConditions = req.body.symptoms.map((symptom: string) => ({
      symptoms: { [Op.like]: `%${symptom}%` },
    }));
    const treatmentsConditions = req.body.treatments.map(
      (treatment: string) => ({ treatments: { [Op.like]: `%${treatment}%` } })
    );

    const info = await MedicineArticlesOwn.findAll({
      raw: true,
      attributes: [
        "id",
        "title",
        "symptoms",
        "treatments",
        "url",
        "short_text",
      ],
      where: {
        [Op.and]: [
          { [Op.or]: symptomsConditions },
          { [Op.or]: treatmentsConditions },
        ],
      },
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
