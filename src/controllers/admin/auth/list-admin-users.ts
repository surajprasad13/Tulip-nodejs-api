import { Request, Response } from 'express'
import AdminRolesModel from '../../../models/admin/admin-roles'
import AdminUserModel from '../../../models/admin/admin-user'
import AdminUserRolesModel from '../../../models/admin/admin-user-roles'

export const listAdminUsers = async (req: Request, res: Response) => {
  try {
    const adminRoles = await getAdminRoles()
    const adminUsers = (await AdminUserModel.findAll({})).map((d: any) => d.get({ plain: true }))
    const adminUserRoles = (await AdminUserRolesModel.findAll({})).map((d: any) => d.get({ plain: true }))

    adminUsers.forEach((user: any) => {
      user.roles = adminUserRoles
        .filter((aur: any) => aur.admin_user_id === user.id)
        .map((aur: any) => adminRoles[aur.admin_role_id])

      delete user.password_hash
    })

    res.json(adminUsers)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

async function getAdminRoles() {
  const adminRoles: Array<any> = (await AdminRolesModel.findAll({})).map((d: any) => d.get({ plain: true }))

  return adminRoles.reduce((acc, curr) => {
    acc[curr.id] = curr.jwt_claim

    return acc
  }, {})
}
