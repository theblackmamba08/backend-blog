const blogsRouter = require('express').Router()
const Blog = require('./../models/blog')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogsRouter.post('/', async (request, response) => {
    const blog = new Blog(request.body)

    const result = await blog.save()
    response.status(201).json(result)
})

blogsRouter.put('/:id', async (request, response) => {
    const { likes } = request.body

    const blog = await Blog.findById(request.params.id)
    if (!blog) {
        return response.status(404).json({
            message: 'Le blog a déjà été supprimée du serveur.',
        })
    }

    blog.likes = likes
    const updatedBlog = await blog.save()
    response.json(updatedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
    const blog = await Blog.findOneAndDelete({ _id: request.params.id })

    if (!blog) {
        return response.status(404).json({
            message: 'Le blog a déjà été supprimée du serveur.',
        })
    }
    response.status(204).end()
})

module.exports = blogsRouter
