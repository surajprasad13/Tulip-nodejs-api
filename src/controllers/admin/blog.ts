import { Request, Response } from 'express'
import BlogModel from '../../models/blog'

export const postBlog = async (req: Request, res: Response) => {
  try {
    const insert: any = {
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      url: req.body.url || null,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const blog = new BlogModel(insert)
    await blog.save()

    res.send({
      id: blog.id,
      category: blog.category,
      title: blog.title,
      description: blog.description,
      image: blog.image,
      url: blog.url,
      created_at: blog.created_at,
      updated_at: blog.updated_at,
    })
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    await BlogModel.destroy({
      where: {
        id: req.params.id,
      },
    })

    res.status(200).send()
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}

export const editBlog = async (req: Request, res: Response) => {
  try {
    const updateData: any = {
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      url: req.body.url || null,
      updated_at: new Date(),
    }

    await BlogModel.update(updateData, {
      where: { id: req.params.id },
      returning: true,
      plain: true,
    })

    const blog = await BlogModel.findOne({
      where: {
        id: req.params.id,
      },
      raw: true,
    })

    res.status(200).send({
      id: blog.id,
      category: blog.category,
      title: blog.title,
      description: blog.description,
      image: blog.image,
      url: blog.url,
      created_at: blog.created_at,
      updated_at: blog.updated_at,
    })
  } catch (error) {
    console.log(error)

    res.status(500).send({ message: 'INTERNAL ERROR' })
  }
}
