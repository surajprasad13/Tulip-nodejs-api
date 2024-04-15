import { Request, Response } from 'express'
import AdminRolesModel from '../../../models/admin/admin-roles'
import AdminUserModel from '../../../models/admin/admin-user'
import AdminUserRolesModel from '../../../models/admin/admin-user-roles'
import * as admin from 'firebase-admin'

export const deleteAdminUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id

    const adminUser = await AdminUserModel.findOne({
      raw: true,
      where: {
        id: userId,
      },
    })

    if (!adminUser) {
      return res.status(400).json({
        msg: 'Admin user not found.',
      })
    }

    if (adminUser.firebase_uid) {
      await admin.auth().deleteUser(adminUser.firebase_uid)
    }

    await AdminUserRolesModel.destroy({
      where: {
        admin_user_id: userId,
      },
    })

    await AdminUserModel.destroy({
      where: {
        id: userId,
      },
    })

    res.status(200).send()
  } catch (err) {
    console.log(err);    
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}
