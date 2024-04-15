import { Request, Response, NextFunction } from 'express'
import { verify } from 'jsonwebtoken'

export const ROLES = {
  DOCTOR: 'DOCTOR',
  ROOT_ADMIN: 'ROOT_ADMIN',
  WELLNESS_ADVISOR: 'WELLNESS_ADVISOR',
}

export function adminJwtValidate(requiredRoles: Array<string>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers.authorization ?? '').replace('Bearer', '').trim()

    if (!token) {
      return res.status(401).json({
        message: `Token is mandatory`,
      })
    }

    try {
      const payload: any = verify(token, process.env.ADMIN_JWT_PRIVATE_KEY ?? '')

      for (const requiredRole of requiredRoles) {
        if (!(payload.roles ?? []).includes(requiredRole)) {
          return res.status(403).json({
            message: `Forbidden`,
          })
        }
      }

      req.body.payload = payload
    } catch (err) {
      return res.status(401).json({
        message: `Invalid Token`,
      })
    }

    next()
  }
}

export const adminOrUserJwtValidate = async (req: Request, res: Response, next: NextFunction) => {
  const token = (req.headers.authorization ?? '').replace('Bearer', '').trim()

  if (!token) {
    return res.status(401).json({
      message: `Token is mandatory`,
    })
  }

  try {
    const payload = verify(token, process.env.JWT_PRIVATE_KEY ?? ' ')
    req.body.payload = payload
  } catch (err) {
    try {
      const payload: any = verify(token, process.env.ADMIN_JWT_PRIVATE_KEY ?? '')

      req.body.payload = payload
    } catch (err) {
      return res.status(401).json({
        message: `Invalid Token`,
      })
    }
  }

  next()
}
