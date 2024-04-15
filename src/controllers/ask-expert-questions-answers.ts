import { Request, Response } from 'express'
import AskExpertQuestionsAnswersModel from '../models/ask_expert_questions_answers'
import { getLoggedInUserId } from '../utils'

const categories = [
  'general',
  'mental health',
  'nutrition',
  'physical activity',
  'lifestyle & sleep',
  'symptoms',
  'natural remedies & supplements',
]

export const createQuestion = async (req: Request, res: Response) => {
  try {
    let { category, question } = req.body

    category = categories.includes(category) ? category : 'general'

    const userId = getLoggedInUserId(req)

    if (!userId) {
      return res.status(401).send({})
    }

    const data = {
      category,
      question,
      answer: null,
      is_initial_dataset: false,
      is_visible: false,
      user_id: userId
    }

    await AskExpertQuestionsAnswersModel.create(data)

    res.status(200).send()
  } catch (error) {
    console.log(error)
    res.status(500).send({})
  }
}

export const getAllQuestions = async (req: Request, res: Response) => {
	const questions = await AskExpertQuestionsAnswersModel.findAll({ order: [["id", "DESC"]] })

	if (questions) {
		res.json(questions)
	} else {
		res.status(404).json({
			msg: `questions not found`,
		})
	}
}

export const updateQuestion = async (req: Request, res: Response) => {
	const id = req.body.id
  const answer = req.body.answer
  const category = req.body.category
  const isVisible = req.body.isVisible
  const question = req.body.question
  
	await AskExpertQuestionsAnswersModel.update(
		{ 
      answer,
      category,
      is_visible: isVisible,
      question
     },
		{
			where: { id },
		}
	)

	const updatedQuestion = await AskExpertQuestionsAnswersModel.findOne({
		where: {
			id,
		},
	})

	res.json(updatedQuestion)
}
