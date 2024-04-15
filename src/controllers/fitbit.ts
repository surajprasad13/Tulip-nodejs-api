import { Request, Response } from "express"

import { code_verifier, code_challenge, base64Encode } from "../utils"

const getPkce = async (req: Request, res: Response) => {
	try {
		res.send({
			base64Encode,
			code_verifier,
			code_challenge,
		})
	} catch (error) {
		res.status(400).send({
			error,
		})
	}
}

export { getPkce }
