const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('../utils/test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

describe('when there is initially some blogs saved', () => {
    beforeEach(async () => {
        await Blog.deleteMany({})

        await Blog.insertMany(helper.initialBlogs)
    })

    test('all blogs are returned as json', async () => {
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
        assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('all blogs are returned with an id property', async () => {
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const allHaveIdProp = response.body.every((blog) => 'id' in blog)
        assert.strictEqual(response.body.length, helper.initialBlogs.length)
        assert.equal(allHaveIdProp, true)
    })

    test('a specific blog is within the returned blogs', async () => {
        const response = await api.get('/api/blogs')
        const titles = response.body.map((e) => e.title)
        assert(titles.includes('Understanding MongoDB with Mongoose'))
    })

    describe('addition of a new blog', () => {
        test('a valid blog can be added', async () => {
            const newBlog = {
                title: 'Introduction express',
                author: 'adoum',
                url: 'https://fullstackopenclassrooms.com/nodejs',
                likes: 12,
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(
                blogsAtEnd.length,
                helper.initialBlogs.length + 1
            )

            const titles = blogsAtEnd.map((n) => n.title)
            assert(titles.includes('Introduction express'))
        })

        test('a blog without likes is set to zero', async () => {
            const newBlog = {
                title: 'Introduction Mongoose',
                author: 'Fare..',
                url: 'https://fullstackopenclass.com/nodejs',
            }

            const response = await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(
                blogsAtEnd.length,
                helper.initialBlogs.length + 1
            )

            const titles = blogsAtEnd.map((n) => n.title)
            assert(titles.includes('Introduction Mongoose'))
            assert(response.body.likes === 0)
        })

        test('blog without title or/and url is not added', async () => {
            const newBlog = {
                author: 'Fare..',
            }

            await api.post('/api/blogs').send(newBlog).expect(400)

            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
        })
    })

    describe('update of a blog', () => {
        test('an existing blog can be updated', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToUpdate = blogsAtStart[0]
            const updateRequest = {
                likes: 50,
            }

            const response = await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .send(updateRequest)
                .expect(200)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
            assert.strictEqual(response.body.likes, 50)
        })

        test('fails with statuscode 404 if blog does not exist', async () => {
            const validNonexistingId = await helper.nonExistingId()

            const updateRequest = {
                likes: 50,
            }

            await api
                .put(`/api/blogs/${validNonexistingId}`)
                .send(updateRequest)
                .expect(404)
        })
    })

    describe('viewing a specific blog', () => {
        test('a specific blog can be viewed', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToView = blogsAtStart[0]

            const resultBlog = await api
                .get(`/api/blogs/${blogToView.id}`)
                .expect(200)
                .expect('Content-Type', /application\/json/)

            assert.deepStrictEqual(resultBlog.body, blogToView)
        })

        test('fails with statuscode 404 if note does not exist', async () => {
            const validNonexistingId = await helper.nonExistingId()

            await api.get(`/api/blogs/${validNonexistingId}`).expect(404)
        })

        test('fails with statuscode 400 if id is invalid', async () => {
            const invalidId = '5a3d5da59070081a82a3445'

            await api.get(`/api/blogs/${invalidId}`).expect(400)
        })
    })

    describe('deletion of a blog', () => {
        test('succeeds with status code 204 if id is valid', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[0]

            await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

            const blogsAtEnd = await helper.blogsInDb()
            const titles = blogsAtEnd.map((n) => n.title)

            assert(!titles.includes(blogToDelete.title))
            assert.strictEqual(
                blogsAtEnd.length,
                helper.initialBlogs.length - 1
            )
        })

        test('fails with statuscode 404 if blog does not exist', async () => {
            const validNonexistingId = await helper.nonExistingId()

            await api.delete(`/api/blogs/${validNonexistingId}`).expect(404)
        })
    })
})

after(async () => {
    await mongoose.connection.close()
})
