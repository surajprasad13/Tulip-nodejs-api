import { Request, Response } from "express"
import BlogModel from "../models/blog"

const fetchBlogs = async (req: Request, res: Response) => {
	try {
		const limit = +(req.query.limit ?? 10)
		const offset = +(req.query.offset ?? 0)

		const category = req.query.category

		if (category) {
			const { count, rows } = await BlogModel.findAndCountAll({ where: { category }, limit, offset })
			res.send({ count, data: rows })
		} else {
			const { count, rows } = await BlogModel.findAndCountAll({ limit, offset })
			res.send({ count, data: rows })
		}
	} catch (error) {
		res.status(400).send({ error })
	}
}

export { fetchBlogs }
