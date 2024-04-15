import { Request, Response } from 'express'
import SurveyConfigurationModel from '../../models/survey_configuration'
import Questions from '../../models/questions'
import * as _ from 'lodash'
import { createCompletion } from '../../services/GPT-3'

export const updateSurveyConfiguration = async (req: Request, res: Response) => {
  try {
    const updateData: any = {}

    if (req.body.itemType) {
      updateData.type = req.body.itemType
    }

    if (req.body.sentiment) {
      updateData.sentiment = req.body.sentiment
    }

    if (req.body.template) {
      updateData.template = req.body.template
    }

    await SurveyConfigurationModel.update(updateData, {
      where: { id: req.params.id },
    })

    res.send()
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const playground = async (req: Request, res: Response) => {
  try {
    const text = req.body.text || ''
    const model = req.body.model || ''
    const temperature = +req.body.temperature || 0.7
    const max_tokens = +req.body.max_tokens || 256
    const top_p = +req.body.top_p || 1
    const frequency_penalty = +req.body.frequency_penalty || 0
    const presence_penalty = +req.body.presence_penalty || 0

    try {
      const response = await createCompletion(text, {
        model,
        temperature,
        max_tokens,
        top_p,
        frequency_penalty,
        presence_penalty,
      })

      res.json(response)
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  } catch (error: any) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const getSurveyConfiguration = async (req: Request, res: Response) => {
  try {
    const id = +(req.params.id ?? '0')

    const surveyConfiguration = await SurveyConfigurationModel.findOne({ raw: true, where: { id } })

    if (surveyConfiguration) {
      const groups: any = {
        101: 'Sleep',
        102: 'Fatigue',
        103: 'High Blood Sugar',
        104: 'Long Covid',
        105: 'Free Long Covid',
      }

      const question =
        (
          await Questions.findOne({
            raw: true,
            where: {
              group_id: surveyConfiguration.group_id,
              id_question: surveyConfiguration.question_id,
            },
          })
        )?.question ?? ''

      res.json({
        ...surveyConfiguration,
        question,
        group: groups[surveyConfiguration.group_id],
      })
    } else {
      res.status(404).json({
        msg: `Survey configurations not found`,
      })
    }
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const getAllSurveyConfigurations = async (req: Request, res: Response) => {
  try {
    const surveyConfigurations = await SurveyConfigurationModel.findAll({ raw: true })

    const groups: any = {
      101: 'Sleep',
      102: 'Fatigue',
      103: 'High Blood Sugar',
      104: 'Long Covid',
      105: 'Free Long Covid',
    }

    const questions = (
      (await Questions.findAll({
        raw: true,
        where: {
          group_id: [101, 102, 103, 104, 105],
        },
        order: [['id']],
      })) ?? []
    ).reduce((acc: any, question: any) => {
      if (!acc[question.group_id]) {
        acc[question.group_id] = []
      }

      acc[question.group_id][question.id_question] = question.question

      return acc
    }, {})

    if (surveyConfigurations) {
      res.json(
        surveyConfigurations.map((surveyConfiguration: any) => ({
          ..._.omit(surveyConfiguration, ['GPT3_responses']),
          question: questions[surveyConfiguration.group_id][surveyConfiguration.question_id],
          group: groups[surveyConfiguration.group_id],
        }))
      )
    } else {
      res.status(404).json({
        msg: `Survey configurations not found`,
      })
    }
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const createSurveyConfiguration = async (req: Request, res: Response) => {
  try {
    const insert: any = {
      group_id: req.body.groupId,
      type: req.body.itemType,
      question_id: req.body.questionId,
      sentiment: req.body.sentiment,
      template: req.body.template,
      date_created: new Date(),
    }

    const surveyConfiguration = new SurveyConfigurationModel(insert)
    await surveyConfiguration.save()

    const groups: any = {
      101: 'Sleep',
      102: 'Fatigue',
      103: 'High Blood Sugar',
      104: 'Long Covid',
      105: 'Free Long Covid',
    }

    const question =
      (
        await Questions.findOne({
          raw: true,
          where: {
            group_id: req.body.groupId,
            id_question: req.body.questionId,
          },
        })
      )?.question ?? ''

    res.send({
      id: surveyConfiguration.id,
      group_id: surveyConfiguration.group_id,
      type: surveyConfiguration.type,
      question_id: surveyConfiguration.question_id,
      sentiment: surveyConfiguration.sentiment,
      template: surveyConfiguration.template,
      question,
      group: groups[surveyConfiguration.group_id],
      date_created: surveyConfiguration.date_created,
    })
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const deleteSurveyConfiguration = async (req: Request, res: Response) => {
  try {
    await SurveyConfigurationModel.destroy({
      where: {
        id: req.params.id,
      },
    })

    res.status(200).send()
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}
