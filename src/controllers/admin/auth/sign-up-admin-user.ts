import { Request, Response } from 'express'
import AdminRolesModel from '../../../models/admin/admin-roles'
import AdminUserModel from '../../../models/admin/admin-user'
import AdminUserRolesModel from '../../../models/admin/admin-user-roles'
import bcrypt from 'bcrypt'
import * as admin from 'firebase-admin'

export const signUpAdminUser = async (req: Request, res: Response) => {
  try {
    if (!(await signUpValidate(req, res))) {
      return
    }

    const name = req.body.name
    const email = req.body.email
    const password = await hashPassword(req.body.password)
    const roles = req.body.roles

    const rolesIds = await getRolesIds(roles)

    if (rolesIds.length !== roles.length) {
      return res.status(400).json({
        msg: 'Unable to fetch all roles',
      })
    }

    const adminUser = (await createAdminUser({ name, email, password })).get({ plain: true })
    await setAdminUserRoles(adminUser.id, rolesIds)

    const adminUserClean = {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      roles,
    }

    await createFirebaseUser(name, email, req.body.password, roles, adminUser.id)

    res.json(adminUserClean)
  } catch (err) {
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

async function createFirebaseUser(name: string, email: string, password: string, roles: Array<string>, userId: string) {
  if (!roles.includes('WELLNESS_ADVISOR') && !roles.includes('ROOT_ADMIN')) {
    return
  }

  const userRecord = await admin.auth().createUser({
    email: email,
    emailVerified: false,
    password: password,
    displayName: name,
    disabled: false,
  })

  const claims = roles.reduce((acc: any, role) => {
    acc[role] = true
    return acc
  }, {})

  await admin.auth().setCustomUserClaims(userRecord.uid, claims)

  await AdminUserModel.update(
    {
      firebase_uid: userRecord.uid,
    },
    {
      where: { id: userId },
    }
  )
}

async function setAdminUserRoles(id: number, rolesIds: Array<number>) {
  for (const roleId of rolesIds) {
    const data = {
      admin_user_id: id,
      admin_role_id: roleId,
    }

    const adminUserRoles = new AdminUserRolesModel(data)
    await adminUserRoles.save()
  }
}

async function createAdminUser({ name, email, password }: { name: string; email: string; password: string }) {
  const data = {
    name,
    email,
    password_hash: password,
  }

  const adminUser = new AdminUserModel(data)
  await adminUser.save()

  return adminUser
}

async function signUpValidate(req: Request, res: Response): Promise<boolean> {
  if (!isEnvVariablesSet(req, res)) {
    return false
  }

  if (!isRolesValid(req, res)) {
    return false
  }

  if (!(await isNotEmailAlreadyInUse(req, res))) {
    return false
  }

  return true
}

function isEnvVariablesSet(req: Request, res: Response) {
  if (!process.env.BCRYPT_SALT_ROUNDS) {
    console.log('BCRYPT_SALT_ROUNDS environment variable not set.')
    res.status(500).json({
      msg: `Contact Admin`,
    })
    return false
  }

  return true
}

async function isNotEmailAlreadyInUse(req: Request, res: Response): Promise<boolean> {
  const user = await AdminUserModel.findOne({
    where: {
      email: req.body.email,
    },
  })

  if (user) {
    res.status(400).json({
      msg: `E-mail already in use`,
    })

    return false
  }

  return true
}

function isRolesValid(req: Request, res: Response) {
  if (!req.body.roles || !req.body.roles.length) {
    res.status(400).json({
      msg: 'You have to add at least one role',
    })

    return false
  }
  return true
}

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10'), function (err: any, hash: string) {
      if (err) reject(err)
      resolve(hash)
    })
  })
}

async function getRolesIds(roles: Array<string>): Promise<Array<number>> {
  const rolesIds: Array<number> = []

  for (const role of roles) {
    const adminRole = await AdminRolesModel.findOne({
      where: {
        jwt_claim: role,
      },
    })

    if (adminRole && adminRole.id) {
      rolesIds.push(adminRole.id)
    }
  }

  return rolesIds
}
