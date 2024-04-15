import { Request, Response } from "express"
import TestimonialModel from "../models/testimonial"

export const fetchTestimonials = async (req: Request, res: Response) => {
	try {
		const limit = +(req.query.limit ?? 10)
		const offset = +(req.query.offset ?? 0)

		const { count, rows } = await TestimonialModel.findAndCountAll({ where: { is_deleted: false }, limit, offset })

		res.send({ count, data: rows })
	} catch (error) {
		res.status(400).send({ error })
	}
}

export const postTestimonial = async (req: Request, res: Response) => {
	const name = req.query.name
	const description = req.query.description
	const profession = req.query.profession
	const image_url = req.query.image_url
	const group_id = req.query.group_id

	const insert = {
		date_created: new Date(),
		date_updated: new Date(),
		name: name,
		description: description,
		profession: profession,
		image: image_url,
		group_id: group_id,
		is_deleted: false
	}

	try {
		const testimonial = new TestimonialModel(insert)
		await testimonial.save()

		res.json(testimonial)
	} catch (error) {
		res.status(400).send({ error })
	}

}

export const deleteTestimonial = async (req: Request, res: Response) => {
	const id = req.query.id

	const updateData = {
		is_deleted: true
	}

	try {
		await TestimonialModel.update(updateData, {
			where: { id: id },
		})
		res.status(200)
	} catch (error) {
		res.status(400).send({ error })
	}
}