const { Configuration, OpenAIApi } = require('openai')
import { Request, Response } from 'express'
import SymptomConditionMaster from '../../../models/symptom_condition_master'
import config from '../../../config'
import SmartChat from '../../../models/smart_chat'
import * as _ from 'lodash'
import { extractSymptomsAndConditions } from './extractSymptoms'
import { possibleConditions } from './possibleConditions'
import { symptomConditionsMatches } from './symptomConditionsMatches'

export const getSymptomConditionsMatches = async (req: Request, res: Response) => {
  try {
    const other_symptoms_conditions = req.body.other_symptoms_conditions

    console.log('getSymptomConditionsMatches');
    console.log(other_symptoms_conditions);
    
    const output = await symptomConditionsMatches([], other_symptoms_conditions)

    console.log('output');
    console.log(output);
    

    return res.status(200).json(output)
  } catch (err: any) {
    console.error(err)
    console.log('ERROR -->>')

    console.error(err?.response?.data?.error)
    res.status(500).json({ error: 'An error occurred while processing your request.' })
  }
}

function symptomNameList2symptomList(symptomNameList: any[], symptomsAndConditions: any[]) {
  return symptomNameList
    .map((x: any) => symptomsAndConditions.find((y: any) => y.symptom_name.trim().toLowerCase() === x) ?? null)
    .filter((x: any) => x)
}
