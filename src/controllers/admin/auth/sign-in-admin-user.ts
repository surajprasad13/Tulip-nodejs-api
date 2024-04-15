import { Request, Response } from 'express'
import AdminRolesModel from '../../../models/admin/admin-roles'
import AdminUserModel from '../../../models/admin/admin-user'
import AdminUserRolesModel from '../../../models/admin/admin-user-roles'
import { sign } from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export const signInAdminUser = async (req: Request, res: Response) => {
  try {
    if (!(await signInValidate(req, res))) {
      return
    }

    const email = req.body.email
    const password = req.body.password

    const user = await fetchUser(email)

    if (!user) {
      return res.status(400).json({
        msg: 'Sign in error, email or password wrong.',
      })
    }

    if (!(await comparePassword(password, user.password_hash))) {
      return res.status(400).json({
        msg: 'Sign in error, email or password wrong.',
      })
    }

    const userRolesClaims = await fetchUserRolesClaims(user.id)

    const token = createToken(user, userRolesClaims)

    res.json({ access_token: token })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

function signInValidate(req: Request, res: Response): boolean {
  if (!isEnvVariablesSet(req, res)) {
    return false
  }

  return true
}

async function fetchUser(email: string) {
  const user = await AdminUserModel.findOne({
    where: {
      email: email,
    },
  })

  return user
}

function isEnvVariablesSet(req: Request, res: Response) {
  if (!process.env.BCRYPT_SALT_ROUNDS) {
    console.log('BCRYPT_SALT_ROUNDS environment variable not set.')
    res.status(500).json({
      msg: `Contact Admin`,
    })
    return false
  }

  if (!process.env.ADMIN_JWT_PRIVATE_KEY) {
    console.log('ADMIN_JWT_PRIVATE_KEY environment variable not set.')
    res.status(500).json({
      msg: `Contact Admin`,
    })

    return false
  }

  return true
}

async function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, passwordHash, function (err: any, result: boolean) {
      if (err) reject(err)
      resolve(result)
    })
  })
}

async function fetchUserRolesClaims(userId: number) {
  const adminUserRoles = await AdminUserRolesModel.findAll({
    where: {
      admin_user_id: userId,
    },
  })

  if (adminUserRoles && adminUserRoles.length) {
    const adminUserRolesIds: Array<number> = adminUserRoles.map((r: any) => r.admin_role_id)

    const roles = await AdminRolesModel.findAll({
      where: {
        id: adminUserRolesIds,
      },
    })

    return roles.map((r: any) => r.jwt_claim)
  }

  return null
}

function createToken(user: any, userRolesClaims: Array<string>) {
  const expiration = new Date()
  expiration.setHours(expiration.getHours() + 24)

  return sign(
    {
      userId: user.id,
      name: user.name,
      roles: userRolesClaims,
      firebaseAuth: !!user.firebase_uid,
      pushSubscription: user.push_subscription ?? null,
    },
    process.env.ADMIN_JWT_PRIVATE_KEY ?? '',
    { expiresIn: '24h' }
  )
}
