import "dotenv/config"
import { describe, it, expect, vi, beforeEach } from "vitest"
import app from "../../src/index"

// ─── Mock prisma ──────────────────────────────────────────────────────────────
vi.mock("../../src/lib/prisma", () => ({
  default: {
    task: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// ─── Mock jsonwebtoken ────────────────────────────────────────────────────────
// Why mock this?
// jwt.verify() would normally read process.env.JWT_SECRET and do real
// cryptographic work. In tests we don't want that — we want full control
// over what verify() returns so we can simulate valid and invalid tokens
// without having to produce real JWTs.
vi.mock("jsonwebtoken", () => ({
  default: {
    // sign() is called in /auth/register and /auth/login.
    // We return a predictable fake token instead of a real signed JWT.
    sign: vi.fn(() => "mock.jwt.token"),

    // verify() is called in the auth middleware for every /tasks request.
    // By default we make it succeed and return a valid-looking payload.
    // Individual tests can override this with .mockImplementationOnce()
    // to simulate expired or tampered tokens.
    verify: vi.fn(() => ({ userId: "user-123", email: "test@example.com" })),
  },
}))

// ─── Mock bcrypt ──────────────────────────────────────────────────────────────
// Why mock this?
// bcrypt.hash() is intentionally slow (that's the whole point of salt rounds).
// Running real bcrypt in tests would make your test suite painfully slow.
// We replace it with instant fakes that let us test the logic around it.
vi.mock("bcrypt", () => ({
  default: {
    // hash() is called during /register. Return a fake hash string.
    hash: vi.fn(() => Promise.resolve("hashed_password")),

    // compare() is called during /login.
    // Default to true (correct password). Tests for wrong password
    // will override this with .mockResolvedValueOnce(false).
    compare: vi.fn(() => Promise.resolve(true)),
  },
}))

import prisma from "../../src/lib/prisma"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

// ─── Typed mock helpers ───────────────────────────────────────────────────────
// TypeScript doesn't know our imports are mocked vi.fn()s, so we cast them.
// This gives us .mockResolvedValue(), .mockImplementationOnce(), etc.

const mockPrisma = prisma as unknown as {
  task: {
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  user: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
}

const mockJwt = jwt as unknown as {
  sign: ReturnType<typeof vi.fn>
  verify: ReturnType<typeof vi.fn>
}

const mockBcrypt = bcrypt as unknown as {
  hash: ReturnType<typeof vi.fn>
  compare: ReturnType<typeof vi.fn>
}

// ─── Request helper ───────────────────────────────────────────────────────────
// Builds a request with a Bearer token by default.
// Pass token: null to simulate a missing Authorization header.
const makeRequest = (
  method: string,
  path: string,
  body?: object,
  token: string | null = "mock.jwt.token",
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token !== null) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return app.request(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-apply the default mock behaviours after clearAllMocks() wipes them
    mockJwt.sign.mockReturnValue("mock.jwt.token")
    mockJwt.verify.mockReturnValue({ userId: "user-123", email: "test@example.com" })
    mockBcrypt.hash.mockResolvedValue("hashed_password")
    mockBcrypt.compare.mockResolvedValue(true)
  })

  // ── POST /auth/register ────────────────────────────────────────────────────

  describe("POST /auth/register", () => {
    it("returns 201 and a token when given valid credentials", async () => {
      // Simulate: no existing user with this email
      mockPrisma.user.findUnique.mockResolvedValue(null)
      // Simulate: DB creates and returns the new user
      mockPrisma.user.create.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password",
        createdAt: new Date(),
      })

      const res = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.token).toBe("mock.jwt.token")

      // Verify bcrypt.hash was actually called with the plaintext password
      // (not the hash itself — that would mean we stored plaintext)
      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10)

      // Verify prisma stored the HASH, not the plaintext password
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: "test@example.com", passwordHash: "hashed_password" },
      })
    })

    it("returns 409 when email is already registered", async () => {
      // Simulate: email already exists in DB
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-user",
        email: "taken@example.com",
        passwordHash: "some_hash",
        createdAt: new Date(),
      })

      const res = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "taken@example.com", password: "password123" }),
      })

      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.error).toBe("Email already in use")

      // Crucially: we should NOT have tried to create a user
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it("returns 400 when email is invalid", async () => {
      const res = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "password123" }),
      })
      expect(res.status).toBe(400)
    })

    it("returns 400 when password is too short", async () => {
      const res = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "short" }),
      })
      expect(res.status).toBe(400)
    })

    it("returns 400 when body is empty", async () => {
      const res = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
    })
  })

  // ── POST /auth/login ───────────────────────────────────────────────────────

  describe("POST /auth/login", () => {
    const existingUser = {
      id: "user-123",
      email: "test@example.com",
      passwordHash: "hashed_password",
      createdAt: new Date(),
    }

    it("returns 200 and a token when credentials are correct", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser)
      mockBcrypt.compare.mockResolvedValue(true) // password matches

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.token).toBe("mock.jwt.token")

      // bcrypt.compare should be called with the plaintext attempt and the stored hash
      expect(mockBcrypt.compare).toHaveBeenCalledWith("password123", "hashed_password")
    })

    it("returns 401 when email does not exist", async () => {
      // Simulate: no user found for this email
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ghost@example.com", password: "password123" }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      // Must be the same message as wrong password — never reveal which failed
      expect(body.error).toBe("Invalid email or password")

      // Should not reach bcrypt at all if user wasn't found
      expect(mockBcrypt.compare).not.toHaveBeenCalled()
    })

    it("returns 401 when password is wrong", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser)
      mockBcrypt.compare.mockResolvedValue(false) // password does NOT match

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe("Invalid email or password")
    })

    it("returns 400 when body is missing fields", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }), // no password
      })
      expect(res.status).toBe(400)
    })
  })
})

// ─── Tasks API ────────────────────────────────────────────────────────────────

describe("Tasks API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jwt.verify must succeed for every protected /tasks request
    mockJwt.verify.mockReturnValue({ userId: "user-123", email: "test@example.com" })
    mockPrisma.task.count.mockResolvedValue(0) // safe default so offset tests don't crash
  })

  // ── GET /tasks ─────────────────────────────────────────────────────────────

  describe("GET /tasks", () => {
    it("returns 200 and a list of tasks", async () => {
      const fakeTasks = [
        { id: "1", title: "Task 1", done: false, createdAt: new Date() },
        { id: "2", title: "Task 2", done: true, createdAt: new Date() },
      ]
      mockPrisma.task.findMany.mockResolvedValue(fakeTasks)

      const res = await makeRequest("GET", "/tasks")
      expect(res.status).toBe(200)

      const body = await res.json()
      // Response is now paginated — data lives under body.data
      expect(body.data).toHaveLength(2)
      expect(body.data[0].title).toBe("Task 1")
      // Offset pagination metadata should be present when no cursor is given
      expect(body.total).toBeDefined()
      expect(body.page).toBe(1)
      expect(body.totalPages).toBeDefined()
      expect(body.nextCursor).toBeNull()
    })

    it("returns cursor-paginated results when cursor is provided", async () => {
      const fakeTasks = [
        { id: "2", title: "Task 2", done: false, createdAt: new Date() },
        { id: "3", title: "Task 3", done: false, createdAt: new Date() },
      ]
      // Return limit + 1 items to simulate there being a next page
      mockPrisma.task.findMany.mockResolvedValue([
        ...fakeTasks,
        { id: "4", title: "Task 4", done: false, createdAt: new Date() },
      ])

      const res = await makeRequest("GET", "/tasks?limit=2&cursor=1")
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data).toHaveLength(2) // extra item trimmed off
      expect(body.nextCursor).toBe("3") // last item's id
    })

    it("caps limit at 100 regardless of what the client sends", async () => {
      mockPrisma.task.findMany.mockResolvedValue([])
      mockPrisma.task.count.mockResolvedValue(0)

      await makeRequest("GET", "/tasks?limit=9999")

      // Check that findMany was called with take: 100, not 9999
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
    })

    it("returns 401 when Authorization header is missing", async () => {
      const res = await makeRequest("GET", "/tasks", undefined, null)
      expect(res.status).toBe(401)
    })

    it("returns 401 when token is invalid", async () => {
      // Override the default: make verify() throw like it would for a bad token
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error("invalid signature")
      })

      const res = await makeRequest("GET", "/tasks", undefined, "bad.token.here")
      expect(res.status).toBe(401)
    })

    it("returns 401 when token is expired", async () => {
      mockJwt.verify.mockImplementationOnce(() => {
        const err = new Error("jwt expired")
        err.name = "TokenExpiredError"
        throw err
      })

      const res = await makeRequest("GET", "/tasks")
      expect(res.status).toBe(401)
    })
  })

  // ── POST /tasks ────────────────────────────────────────────────────────────

  describe("POST /tasks", () => {
    it("returns 201 and the created task", async () => {
      const fakeTask = { id: "1", title: "Buy groceries", done: false, createdAt: new Date() }
      mockPrisma.task.create.mockResolvedValue(fakeTask)

      const res = await makeRequest("POST", "/tasks", { title: "Buy groceries" })
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.title).toBe("Buy groceries")
      expect(body.done).toBe(false)
    })

    it("returns 400 when title is missing", async () => {
      const res = await makeRequest("POST", "/tasks", {})
      expect(res.status).toBe(400)
    })

    it("returns 400 when title is empty string", async () => {
      const res = await makeRequest("POST", "/tasks", { title: "" })
      expect(res.status).toBe(400)
    })
  })

  // ── PUT /tasks/:id ─────────────────────────────────────────────────────────

  describe("PUT /tasks/:id", () => {
    it("returns 200 and the updated task", async () => {
      const fakeTask = { id: "1", title: "Updated", done: true, createdAt: new Date() }
      mockPrisma.task.update.mockResolvedValue(fakeTask)

      const res = await makeRequest("PUT", "/tasks/1", { title: "Updated", done: true })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.title).toBe("Updated")
      expect(body.done).toBe(true)
    })

    it("returns 404 when task does not exist", async () => {
      mockPrisma.task.update.mockRejectedValue(new Error("Not found"))

      const res = await makeRequest("PUT", "/tasks/fake-id", { title: "Updated" })
      expect(res.status).toBe(404)
    })

    it("returns 400 when body is invalid", async () => {
      const res = await makeRequest("PUT", "/tasks/1", { done: "notaboolean" })
      expect(res.status).toBe(400)
    })
  })

  // ── DELETE /tasks/:id ──────────────────────────────────────────────────────

  describe("DELETE /tasks/:id", () => {
    it("returns 204 when task is deleted", async () => {
      mockPrisma.task.delete.mockResolvedValue({})

      const res = await makeRequest("DELETE", "/tasks/1")
      expect(res.status).toBe(204)
    })

    it("returns 404 when task does not exist", async () => {
      mockPrisma.task.delete.mockRejectedValue(new Error("Not found"))

      const res = await makeRequest("DELETE", "/tasks/fake-id")
      expect(res.status).toBe(404)
    })
  })
})
