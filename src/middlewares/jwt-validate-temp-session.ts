import { Request, Response, NextFunction } from "express"
import { verify } from "jsonwebtoken"
import config from "../config";
const jwt = require("jsonwebtoken")
const crypto = require("crypto");

export const jwtValidate = async (req: Request, res: Response, next: NextFunction) => {
	var token = req.headers['authorization-temp'] as string;
	if (token == null || token == "" ) {
		console.log('regen')
		console.log(token)
		token = generateToken();
		req.body.pre_register_session = token;
	}
	console.log(token)

	try {
		const payload = verify(token, config.JWT_PRIVATE_KEY ?? " ")
		res.locals.payload = payload;
		res.locals.token = token;
	} catch (err) {
		return res.status(401).json({
			message: `Invalid Token`,
		})
	}

	next()
}

export const generateToken = (): string => {
	var t = new Date();
	let date = `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
	var temporaryUserId = date + '-' + crypto.randomBytes(16).toString("hex");
	const token = jwt.sign(
		{
			exp: Math.floor(Date.now() / 1000 + 60 * 60 * 24),
			user_id: temporaryUserId,
			isTemporary: true
		},
		config.JWT_PRIVATE_KEY ?? " "
	)
	return token
} 