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

// GET /tasks - return paginated tasks
// Usage: GET /tasks?limit=10&cursor=abc  (cursor mode — preferred)
//        GET /tasks?limit=10&page=2      (offset mode — fallback)
tasksRouter.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? '10'), 100)
  const cursor = c.req.query('cursor')
  const page = Number(c.req.query('page') ?? '1')

  // --- Cursor pagination ---
  if (cursor) {
    const items = await prisma.task.findMany({
      take: limit + 1,       // fetch one extra to detect if a next page exists
      skip: 1,               // skip the cursor row itself
      cursor: { id: cursor },
      orderBy: { createdAt: 'asc' },
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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.task.count(),
  ])

  return c.json({
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    nextCursor: null,
  })
})

// POST /tasks - create a new task from request body
tasksRouter.post("/", async (c) => {
  const result = CreateTaskSchema.safeParse(await c.req.json())

  if (!result.success) {
    return c.json({ error: z.treeifyError(result.error) }, 400)  // 400 = Bad Request
  }

  const task = await prisma.task.create({
    data: { title: result.data.title },
  })

  return c.json(task, 201)
})

// PUT /tasks/:id - update a task's title and/or done status
tasksRouter.put("/:id", async (c) => {
  const id = c.req.param("id")
  const result = UpdateTaskSchema.safeParse(await c.req.json())

  if (!result.success) {
    return c.json({ error: z.treeifyError(result.error) }, 400)
  }

  try {
    const task = await prisma.task.update({
      where: { id },
      data: result.data,
    })
    return c.json(task)
  } catch {
    return c.json({ error: "Task not found" }, 404)
  }
})

// DELETE /tasks/:id - remove a task
tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id")

  try {
    await prisma.task.delete({
      where: { id },
    })
    return new Response(null, { status: 204 })
  } catch {
    return c.json({ error: "Task not found" }, 404)
  }
})