import { Request, Response } from 'express'
import { UserModel } from '../models'
import SubscriptionUserModel from '../models/user/newsletterSubscription'
import { getLoggedInUserId } from '../utils'

export const subscribe = async (req: Request, res: Response) => {
  try {
    const userId = getLoggedInUserId(req)
    const subscription = await SubscriptionUserModel.findOne({ raw: true, where: { user_id: userId } })

    if (subscription) {
      return res.status(200).json({
        msg: 'Already Subscribed',
      })
    }

    const email = (
      await UserModel.findOne({
        raw: true,
        where: {
          user_id: userId,
        },
      })
    )?.email

    await SubscriptionUserModel.create({
      user_id: userId,
      email,
      active: 1,
    })

    return res.status(200).json({
      msg: 'Subscribed',
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const userId = getLoggedInUserId(req)
    const subscription = await SubscriptionUserModel.findOne({ raw: true, where: { user_id: userId } })

    if (!subscription) {
      return res.status(200).json({
        msg: 'Already Unsubscribed',
      })
    }

    await SubscriptionUserModel.destroy({
      where: {
        user_id: userId,
      },
    })

    return res.status(200).json({
      msg: 'Unsubscribed',
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const isSubscribed = async (req: Request, res: Response) => {
  try {
    const userId = getLoggedInUserId(req)
    const subscription = await SubscriptionUserModel.findOne({ raw: true, where: { user_id: userId } })

    if (subscription) {
      return res.status(200).json({
        isSubscribed: true,
      })
    }

    return res.status(200).json({
      isSubscribed: false,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}
