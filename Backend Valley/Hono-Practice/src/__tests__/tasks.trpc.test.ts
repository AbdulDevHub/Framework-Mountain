import "dotenv/config"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createCallerFactory } from "../../src/trpc/trpc"
import { appRouter } from "../../src/trpc/router"
import type { Context } from "../../src/trpc/context"

// Same inline-mock pattern as tasks.test.ts — no auth needed here since we
// bypass createContext entirely and build context by hand (see makeContext below).
vi.mock("../../src/lib/prisma", () => ({
  default: {
    task: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import prisma from "../../src/lib/prisma"

const mockPrisma = prisma as unknown as {
  task: {
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
}

// createCallerFactory turns appRouter into a plain object of async functions —
// caller.tasks.create(input) — with zero HTTP, zero URL encoding, zero envelope.
// You're testing your procedure logic directly, the way you'd unit test any function.
const createCaller = createCallerFactory(appRouter)

// We build Context by hand instead of running createContext(), which lets us
// directly control userId — exactly what protectedProcedure checks — without
// needing a real or mocked JWT for every test.
function makeContext(userId: string | null): Context {
  return {
    prisma: mockPrisma as any,
    userId,
    email: userId ? "test@example.com" : null,
  }
}

describe("tRPC Tasks Router", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.task.count.mockResolvedValue(0)
  })

  describe("tasks.list", () => {
    it("returns tasks for an authenticated user", async () => {
      const fakeTasks = [{ id: "1", title: "Task 1", done: false, createdAt: new Date() }]
      mockPrisma.task.findMany.mockResolvedValue(fakeTasks)

      const caller = createCaller(makeContext("user-123"))
      const result = await caller.tasks.list({ limit: 10, page: 1 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe("Task 1")
    })

    it("throws UNAUTHORIZED when there's no userId in context", async () => {
      const caller = createCaller(makeContext(null))

      await expect(caller.tasks.list({ limit: 10, page: 1 })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      })
    })
  })

  describe("tasks.create", () => {
    it("creates a task and returns it", async () => {
      const fakeTask = { id: "1", title: "Buy groceries", done: false, createdAt: new Date() }
      mockPrisma.task.create.mockResolvedValue(fakeTask)

      const caller = createCaller(makeContext("user-123"))
      const result = await caller.tasks.create({ title: "Buy groceries" })

      expect(result.title).toBe("Buy groceries")
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: { title: "Buy groceries" },
      })
    })

    it("throws BAD_REQUEST when title is empty", async () => {
      const caller = createCaller(makeContext("user-123"))

      await expect(caller.tasks.create({ title: "" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      })
      expect(mockPrisma.task.create).not.toHaveBeenCalled()
    })

    it("throws UNAUTHORIZED when not logged in", async () => {
      const caller = createCaller(makeContext(null))

      await expect(caller.tasks.create({ title: "Buy groceries" })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      })
    })
  })

  describe("tasks.update", () => {
    it("updates a task and returns it", async () => {
      const fakeTask = { id: "1", title: "Updated", done: true, createdAt: new Date() }
      mockPrisma.task.update.mockResolvedValue(fakeTask)

      const caller = createCaller(makeContext("user-123"))
      const result = await caller.tasks.update({ id: "1", title: "Updated", done: true })

      expect(result.title).toBe("Updated")
      expect(result.done).toBe(true)
    })

    it("throws NOT_FOUND when the task doesn't exist", async () => {
      mockPrisma.task.update.mockRejectedValue(new Error("Not found"))

      const caller = createCaller(makeContext("user-123"))

      await expect(caller.tasks.update({ id: "fake-id", title: "Updated" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      })
    })

    it("throws BAD_REQUEST when done is not a boolean", async () => {
      const caller = createCaller(makeContext("user-123"))

      // Bypass TS static check so we can test tRPC's runtime Zod validation
      await expect(caller.tasks.update({ id: "1", done: "notaboolean" } as any)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      })
    })
  })

  describe("tasks.delete", () => {
    it("deletes a task successfully", async () => {
      mockPrisma.task.delete.mockResolvedValue({})

      const caller = createCaller(makeContext("user-123"))
      const result = await caller.tasks.delete({ id: "1" })

      expect(result).toEqual({ success: true })
    })

    it("throws NOT_FOUND when the task doesn't exist", async () => {
      mockPrisma.task.delete.mockRejectedValue(new Error("Not found"))

      const caller = createCaller(makeContext("user-123"))

      await expect(caller.tasks.delete({ id: "fake-id" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      })
    })

    it("throws UNAUTHORIZED when not logged in", async () => {
      const caller = createCaller(makeContext(null))

      await expect(caller.tasks.delete({ id: "1" })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      })
    })
  })
})
