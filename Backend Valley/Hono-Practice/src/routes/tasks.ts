import { Hono } from "hono"
import { z } from "zod"
import prisma from "../lib/prisma"

export const tasksRouter = new Hono()

const CreateTaskSchema = z.object({
  title: z.string().min(1),
})

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
})

// GET /tasks - return paginated tasks, scoped to the authenticated user
// Usage: GET /tasks?limit=10&cursor=abc  (cursor mode — preferred)
//        GET /tasks?limit=10&page=2      (offset mode — fallback)
tasksRouter.get("/", async (c) => {
  const userId = c.get("userId")
  const limit = Math.min(Number(c.req.query("limit") ?? "10"), 100)
  const cursor = c.req.query("cursor")
  const page = Number(c.req.query("page") ?? "1")

  // --- Cursor pagination ---
  if (cursor) {
    const items = await prisma.task.findMany({
      take: limit + 1, // fetch one extra to detect if a next page exists
      skip: 1, // skip the cursor row itself
      cursor: { id: cursor },
      where: { userId }, // only this user's tasks
      orderBy: { createdAt: "asc" },
    })

    const hasNextPage = items.length > limit
    const data = hasNextPage ? items.slice(0, -1) : items

    return c.json({
      data,
      nextCursor: hasNextPage ? data[data.length - 1].id : null,
    })
  }

  // --- Offset pagination ---
  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.count({ where: { userId } }),
  ])

  return c.json({
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    nextCursor: null,
  })
})

// POST /tasks - create a new task from request body, owned by the caller
tasksRouter.post("/", async (c) => {
  const userId = c.get("userId")
  const result = CreateTaskSchema.safeParse(await c.req.json())

  if (!result.success) {
    return c.json({ error: z.treeifyError(result.error) }, 400) // 400 = Bad Request
  }

  const task = await prisma.task.create({
    data: { title: result.data.title, userId },
  })

  return c.json(task, 201)
})

// PUT /tasks/:id - update a task's title and/or done status.
// Returns 404 whether the task doesn't exist OR belongs to another user —
// the caller can't distinguish the two, same intent as the login endpoint
// not revealing which of email/password was wrong.
tasksRouter.put("/:id", async (c) => {
  const userId = c.get("userId")
  const id = c.req.param("id")
  const result = UpdateTaskSchema.safeParse(await c.req.json())

  if (!result.success) {
    return c.json({ error: z.treeifyError(result.error) }, 400)
  }

  try {
    const task = await prisma.task.update({
      where: { id, userId },
      data: result.data,
    })
    return c.json(task)
  } catch {
    return c.json({ error: "Task not found" }, 404)
  }
})

// DELETE /tasks/:id - remove a task (same ownership scoping as PUT)
tasksRouter.delete("/:id", async (c) => {
  const userId = c.get("userId")
  const id = c.req.param("id")

  try {
    await prisma.task.delete({
      where: { id, userId },
    })
    return new Response(null, { status: 204 })
  } catch {
    return c.json({ error: "Task not found" }, 404)
  }
})
