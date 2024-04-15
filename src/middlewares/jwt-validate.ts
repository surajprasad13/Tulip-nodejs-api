import { Request, Response, NextFunction } from "express"
import { verify } from "jsonwebtoken"
import config from "../config"
const jwt = require("jsonwebtoken")

export const jwtValidate = async (req: Request, res: Response, next: NextFunction) => {
	const token = (req.headers.authorization ?? "").replace("Bearer", "").trim()

	if (!token) {
		return res.status(401).json({
			message: `Token is mandatory`,
		})
	}

	try {
		const payload = verify(token, config.JWT_PRIVATE_KEY ?? " ")
		req.body.payload = payload
	} catch (err) {
		return res.status(401).json({
			message: `Invalid Token`,
		})
	}

	next()
}

export const DecodeToken = (token: string) => {
	return verify(token.replace("Bearer", "").trim(), config.JWT_PRIVATE_KEY ?? " ")
}

export const generateToken = (user_id: number) => {
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000 + 60 * 60 * 24),
			user_id,
		},
		config.JWT_PRIVATE_KEY ?? " "
	)
	return token
}
export const generate20MinuteToken = (user_id: number) => {
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
			user_id,
		},
		config.JWT_PRIVATE_KEY ?? " "
	)
	return token
}
