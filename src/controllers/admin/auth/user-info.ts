import { Request, Response } from 'express'
import AdminUserModel from '../../../models/admin/admin-user'
import { getLoggedInAdminUserId } from '../../../utils'

export const getAdminUserInfo = async (req: Request, res: Response) => {
  try {
    const adminUserId = getLoggedInAdminUserId(req)

    const user = await AdminUserModel.findOne({ raw: true, where: { id: adminUserId } })

    res.json({
      id: user.id,
      name: user.name,
      designation: user.designation,
      profileImage: user.profile_image,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}
