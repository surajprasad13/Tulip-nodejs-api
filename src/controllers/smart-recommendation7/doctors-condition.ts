import { Request, Response } from 'express'


const handleDoctorsConditionRequest = async (req: Request, res: Response) => {
  try {
    let { condition_name } = req.body

    return res.json({})
  } catch (error) {
    console.log(error)

    res.status(400).send({ error })
  }
}



// let url = `https://us-central1-tulip-final-dev.cloudfunctions.net/apiSearch/search-web`;
// body = {
//     query: ''
//     domain: 'doctors-condition'
//     isStudy: false

// }

export { handleDoctorsConditionRequest }
