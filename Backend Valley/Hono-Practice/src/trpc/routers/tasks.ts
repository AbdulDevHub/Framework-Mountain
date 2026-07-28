import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, protectedProcedure } from "../trpc"

const CreateTaskSchema = z.object({
  title: z.string().min(1),
})

const UpdateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
})

const ListTasksSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  page: z.number().min(1).default(1),
})

export const tasksRouter = router({
  list: protectedProcedure
    .input(ListTasksSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, page } = input

      if (cursor) {
        const items = await ctx.prisma.task.findMany({
          take: limit + 1,
          skip: 1,
          cursor: { id: cursor },
          // Ownership filter — a user can only ever page through their own tasks.
          // Also means a cursor id from another user's task simply yields an
          // empty page rather than leaking their rows.
          where: { userId: ctx.userId },
          orderBy: { createdAt: "asc" },
        })
        const hasNextPage = items.length > limit
        const data = hasNextPage ? items.slice(0, -1) : items
        return {
          data,
          nextCursor: hasNextPage ? data[data.length - 1].id : null,
        }
      }

      const [items, total] = await Promise.all([
        ctx.prisma.task.findMany({
          where: { userId: ctx.userId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "asc" },
        }),
        ctx.prisma.task.count({ where: { userId: ctx.userId } }),
      ])

      return {
        data: items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        nextCursor: null,
      }
    }),

  create: protectedProcedure
    .input(CreateTaskSchema)
    .mutation(({ ctx, input }) => {
      // Ownership is assigned at creation time, straight from the verified
      // JWT — never trust a userId if it ever showed up in client input.
      return ctx.prisma.task.create({
        data: { title: input.title, userId: ctx.userId },
      })
    }),

  update: protectedProcedure
    .input(UpdateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      try {
        // where: { id, userId } means this only matches a row that is BOTH
        // the requested id AND owned by the caller. If it's someone else's
        // task, this throws exactly the same way as if the id didn't exist
        // at all — Prisma's P2025 "record not found" — so we can't (and
        // shouldn't) distinguish the two cases in the response.
        return await ctx.prisma.task.update({
          where: { id, userId: ctx.userId },
          data,
        })
      } catch {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" })
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.task.delete({
          where: { id: input.id, userId: ctx.userId },
        })
        return { success: true }
      } catch {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" })
      }
    }),
})
