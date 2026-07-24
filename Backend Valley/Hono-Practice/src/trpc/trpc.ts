import { initTRPC, TRPCError } from "@trpc/server"
import type { Context } from "./context"

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing or invalid token",
    })
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // 👈 narrows string | null → string for everything downstream
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed)
