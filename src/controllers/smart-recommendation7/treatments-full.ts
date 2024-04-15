import { Request, Response } from 'express'
import TreatmentMaster from '../../models/masters/treatment_master'

const getTreatmentsFull = async (req: Request, res: Response) => {
    try {

      return res.json(((await TreatmentMaster.findAll({ 
        raw: true,
        attributes: [
          'id',
          'treatment_id',
          'treatment_name',
          'treatment_type',
          'common_names',
          'image_url',
          'main_actions_id',
          'supporting_actions_id',
          'categories',
          'constitution',
          'ayurvedic_name',
          'chinese_name',
          'humata_synonyms',
          'gpt_treatment_name',
          'treatment_synonyms',
          'priority',
          'fullscript_id'
        ]
      }))??[]).map((t: any) => ({
        treatment_id: t?.treatment_id,
        treatment_name: t?.treatment_name,
        image_url: t?.image_url,
        gpt_treatment_name: t?.gpt_treatment_name,
        treatment_synonyms: t?.treatment_synonyms,
        humata_synonyms: t?.humata_synonyms,
        common_names: t?.common_names,
        ayurvedic_name: t?.ayurvedic_name,
        chinese_name: t?.chinese_name,
        constitution: t?.constitution,
        treatment_type: t?.treatment_type,
        priority: t?.priority??null,
        fullscript_id: t?.fullscript_id??null,
      })))
      
    } catch (error) {
      console.log(error)
  
      res.status(400).send({ error })
    }
  }

  export { getTreatmentsFull }