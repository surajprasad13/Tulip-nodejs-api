import { Request, Response } from 'express'
import Questions from "../../models/questions"

export const getAyurvedicAndChineseQuestions = async (req: Request, res: Response) => {
    try {
        res.status(200).send((await Questions.findAll({
            where: {
                group_id: 106
            },
            order: [["id"]],
        }))??[])

    } catch (err: any) {
      console.error(err)
      console.log('ERROR -->>')
  
      console.error(err?.response?.data?.error)
      res.status(500).json({ error: 'An error occurred while processing your request.' })
    }
  }