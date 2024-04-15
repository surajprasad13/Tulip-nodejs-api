import { Request, Response } from 'express'
import { UserModel, UserProfileModel } from '../../models'
import UserAnswers from '../../models/useranswers'
import { getAllQuestions } from '../chat'
import { getContra } from '../contra-defi/contraindications'
import { getDeficiency } from '../contra-defi/deficiency'
import { getRemedies } from '../remedy'
import { Op, Sequelize } from 'sequelize'

export const getQuestions = async (req: Request, res: Response) => {
  return getAllQuestions(req, res)
}

export const getUserRemedies = async (req: Request, res: Response) => {
  const userId = +(req.params.id ?? '0')
  req.body.payload = {
    user_id: userId,
  }

  return getRemedies(req, res)
}

export const getUserDeficiency = async (req: Request, res: Response) => {
  const userId = +(req.params.id ?? '0')
  req.body.payload = {
    user_id: userId,
  }

  return getDeficiency(req, res)
}

export const getContraindications = async (req: Request, res: Response) => {
  const userId = +(req.params.id ?? '0')
  req.body.payload = {
    user_id: userId,
  }

  try {
    return getContra(req, res)
  } catch (err) {
    res.json([])
  }
}

export const fetchUsers = async (req: Request, res: Response) => {
  const limit = +(req.query.limit ?? '20')
  const offset = +(req.query.offset ?? '0')

  let where = {}

  if (req.query.textsearch && req.query.textsearch.length && req.query.textsearch.length > 3) {
    const textsearch = req.query.textsearch.toString().toLowerCase()

    const firstNameMatches =
      (await UserProfileModel.findAll({
        raw: true,
        where: {
          first_name: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('first_name')),
            'LIKE',
            '%' + textsearch + '%'
          ),
        },
      })) || []

    const userProfilesIds = firstNameMatches.map((m: any) => m.user_id)

    where = {
      [Op.or]: [
        { user_id: userProfilesIds },
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('email')), 'LIKE', '%' + textsearch + '%'),
      ],
    }
  }

  const users = await UserModel.findAll({ raw: true, where, limit, offset, order: [['user_id', 'DESC']] })

  const usersProfileData = (
    (await UserProfileModel.findAll({ raw: true, where: { user_id: users.map((user: any) => user.user_id) } })) ?? []
  ).reduce((acc: any, curr: any) => {
    acc[curr.user_id] = curr
    return acc
  }, {})

  if (users?.length) {
    res.json(users.map((user: any) => ({ ...buildUser(user, usersProfileData[user.user_id]) })))
  } else {
    res.json([])
  }
}

export const getUser = async (req: Request, res: Response) => {
  const userId = +(req.params.id ?? '0')

  const userData = await UserModel.findOne({ raw: true, where: { user_id: userId } })

  if (!userData) {
    return res.status(404).json({
      msg: `User not found`,
    })
  }

  const usersProfileData = await UserProfileModel.findOne({ raw: true, where: { user_id: userId } })

  if (!usersProfileData) {
    return res.status(404).json({
      msg: `User profile data not found`,
    })
  }

  const user: any = buildUser(userData, usersProfileData)

  user.answers = await getUserAnswers(userId)

  res.json(user)
}

async function getUserAnswers(userId: number) {
  const groups = [100, 101, 102, 103, 104, 105]
  const answers: any = {}

  for (const group of groups) {
    const answer = await UserAnswers.findOne({
      raw: true,
      where: { user_id: userId, group_id: group },
      order: [['time', 'DESC']],
    })
    if (answer) {
      answers[group] = answer.data
    }
  }

  return answers
}

function buildUser(user: any, userProfile: any) {
  return {
    userId: user.user_id,
    email: user.email,
    lastLogin: user.last_login,
    dateCreated: user.date_created,
    userType: user.user_type,
    emailVerified: user.email_verified,
    profileImage: userProfile?.profile_image,
    dob: userProfile?.data?.dob,
    sex: userProfile?.data?.sex,
    phone: userProfile?.data?.phone,
    timezone: userProfile?.data?.timezone,
    firstName: userProfile?.data?.first_name || userProfile?.first_name,
    lastName: userProfile?.data?.last_name || userProfile?.last_name,
    addressZip: userProfile?.data?.address_zip,
    addressCity: userProfile?.data?.address_city,
    addressLine1: userProfile?.data?.addres_line1,
    addressLine2: userProfile?.data?.addressLine2,
    addressCountry: userProfile?.data?.address_country,
    communicationPreference: userProfile?.data?.communication_preference,
  }
}
