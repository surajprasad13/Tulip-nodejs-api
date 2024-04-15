const { Configuration, OpenAIApi } = require('openai')
import { Request, Response } from 'express'
import SymptomConditionMaster from '../../../models/symptom_condition_master'
import config from '../../../config'
import SmartChat from '../../../models/smart_chat'
import * as _ from 'lodash'
import { extractSymptomsAndConditions } from './extractSymptoms'
import { possibleConditions } from './possibleConditions'
import { symptomConditionsMatches } from './symptomConditionsMatches'

export const getSymptomsAndConditions = async (req: Request, res: Response) => {
  try {
    const session_id = +req.body.session_id

    const chat = req.body.chat

    if (session_id) {
      const messages = req.body.chat

      if(messages.length){
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          symptomAndConditionsEndpoint: true
        }
      }

      await SmartChat.create({
        session_id,
        messages
      })
    }

    const symptomsAndConditionsMaster = await SymptomConditionMaster.findAll({ raw: true })

    let { main_symptoms_conditions, other_symptoms_conditions } = await extractSymptomsAndConditions(
      symptomsAndConditionsMaster,
      chat
    )

    // const possible_conditions_with_pdf = await possibleConditions(
    //   main_symptoms_conditions,
    //   other_symptoms_conditions,
    //   symptomsAndConditionsMaster,
    //   chat,
    //   true
    // )

    // const possible_conditions_without_pdf = await possibleConditions(
    //   main_symptoms_conditions,
    //   other_symptoms_conditions,
    //   symptomsAndConditionsMaster,
    //   chat,
    //   false
    // )

    const possible_conditions_with_pdf:any = []
    const possible_conditions_without_pdf:any = []

    main_symptoms_conditions = symptomNameList2symptomList(main_symptoms_conditions, symptomsAndConditionsMaster)

    other_symptoms_conditions = symptomNameList2symptomList(other_symptoms_conditions, symptomsAndConditionsMaster)

    const symptom_conditions_matches = await symptomConditionsMatches(
      main_symptoms_conditions,
      other_symptoms_conditions
    )

    res
      .status(200)
      .json({ main_symptoms_conditions, other_symptoms_conditions, possible_conditions_with_pdf, possible_conditions_without_pdf, symptom_conditions_matches })

    //res.status(200).json({main_symptoms_conditions, other_symptoms_conditions})

    // console.log(`other_symptoms_conditions: ${other_symptoms_conditions}`)

    // console.log(`main_symptoms_conditions: ${main_symptoms_conditions}`)
    // console.log(`other_symptoms_conditions: ${other_symptoms_conditions}`)

    // main_symptoms_conditions = main_symptoms_conditions
    //   .map((x: any) => symptomsAndConditions.find((y: any) => y.symptom_name.trim().toLowerCase() === x) ?? null)
    //   .filter((x: any) => x)
    // other_symptoms_conditions = other_symptoms_conditions
    //   .map((x: any) => symptomsAndConditions.find((y: any) => y.symptom_name.trim().toLowerCase() === x.trim().toLowerCase()) ?? ({
    //     symptom_name: x.trim().toLowerCase(),
    //   }))
    //   .filter((x: any) => x)

    // res.status(200).json({
    //   main_symptoms_conditions,
    //   other_symptoms_conditions,
    //   symptom_conditions_matches,
    //   possibleConditions: await possibleConditions(
    //     main_symptoms_conditions,
    //     other_symptoms_conditions,
    //     symptomsAndConditions,
    //     chat
    //   ),
    // })
  } catch (err: any) {
    console.error(err)
    console.log('ERROR -->>')

    console.error(err?.response?.data?.error)
    res.status(500).json({ error: 'An error occurred while processing your request.' })
  }
}

function symptomNameList2symptomList(symptomNameList: any[], symptomsAndConditions: any[]) {
  return symptomNameList
    .map((x: any) => symptomsAndConditions.find((y: any) => y.symptom_name.trim().toLowerCase() === x.trim().toLowerCase()) ?? null)
    .filter((x: any) => x)
}
