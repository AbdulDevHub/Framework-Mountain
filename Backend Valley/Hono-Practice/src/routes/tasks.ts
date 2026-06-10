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

// GET /tasks - return all tasks
tasksRouter.get("/", async (c) => {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "asc" },
  })
  return c.json(tasks)
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