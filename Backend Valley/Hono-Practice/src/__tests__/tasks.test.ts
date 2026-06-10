import 'dotenv/config'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../../src/index'

// Tell Vitest: whenever any file imports '../../src/lib/prisma', use our mock instead
vi.mock('../../src/lib/prisma', () => ({
  default: {
    task: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import prisma from '../../src/lib/prisma'

// prisma is a real PrismaClient type; cast via unknown to the mocked shape to satisfy TS
const mockPrisma = prisma as unknown as {
  task: {
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

const authHeader = { 'x-api-key': process.env.API_KEY || 'secret123' }

const makeRequest = (method: string, path: string, body?: object, headers?: object) => {
  return app.request(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('Tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // GET /tasks
  describe('GET /tasks', () => {
    it('returns 200 and a list of tasks', async () => {
      const fakeTasks = [
        { id: '1', title: 'Task 1', done: false, createdAt: new Date() },
        { id: '2', title: 'Task 2', done: true, createdAt: new Date() },
      ]
      mockPrisma.task.findMany.mockResolvedValue(fakeTasks)

      const res = await makeRequest('GET', '/tasks')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveLength(2)
      expect(body[0].title).toBe('Task 1')
    })

    it('returns 401 when no api key is provided', async () => {
      const res = await app.request('/tasks', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      expect(res.status).toBe(401)
    })

    it('returns 403 when wrong api key is provided', async () => {
      const res = await makeRequest('GET', '/tasks', undefined, { 'x-api-key': 'wrongkey' })
      expect(res.status).toBe(403)
    })
  })

  // POST /tasks
  describe('POST /tasks', () => {
    it('returns 201 and the created task', async () => {
      const fakeTask = { id: '1', title: 'Buy groceries', done: false, createdAt: new Date() }
      mockPrisma.task.create.mockResolvedValue(fakeTask)

      const res = await makeRequest('POST', '/tasks', { title: 'Buy groceries' })
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.title).toBe('Buy groceries')
      expect(body.done).toBe(false)
    })

    it('returns 400 when title is missing', async () => {
      const res = await makeRequest('POST', '/tasks', {})
      expect(res.status).toBe(400)
    })

    it('returns 400 when title is empty string', async () => {
      const res = await makeRequest('POST', '/tasks', { title: '' })
      expect(res.status).toBe(400)
    })
  })

  // PUT /tasks/:id
  describe('PUT /tasks/:id', () => {
    it('returns 200 and the updated task', async () => {
      const fakeTask = { id: '1', title: 'Updated', done: true, createdAt: new Date() }
      mockPrisma.task.update.mockResolvedValue(fakeTask)

      const res = await makeRequest('PUT', '/tasks/1', { title: 'Updated', done: true })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.title).toBe('Updated')
      expect(body.done).toBe(true)
    })

    it('returns 404 when task does not exist', async () => {
      mockPrisma.task.update.mockRejectedValue(new Error('Not found'))

      const res = await makeRequest('PUT', '/tasks/fake-id', { title: 'Updated' })
      expect(res.status).toBe(404)
    })

    it('returns 400 when body is invalid', async () => {
      const res = await makeRequest('PUT', '/tasks/1', { done: 'notaboolean' })
      expect(res.status).toBe(400)
    })
  })

  // DELETE /tasks/:id
  describe('DELETE /tasks/:id', () => {
    it('returns 204 when task is deleted', async () => {
      mockPrisma.task.delete.mockResolvedValue({})

      const res = await makeRequest('DELETE', '/tasks/1')
      expect(res.status).toBe(204)
    })

    it('returns 404 when task does not exist', async () => {
      mockPrisma.task.delete.mockRejectedValue(new Error('Not found'))

      const res = await makeRequest('DELETE', '/tasks/fake-id')
      expect(res.status).toBe(404)
    })
  })
})