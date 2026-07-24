import { router, publicProcedure } from "./trpc"
import { tasksRouter } from "./routers/tasks"

export const appRouter = router({
  hello: publicProcedure.query(() => ({ message: "Hello from tRPC!" })),
  tasks: tasksRouter,
})

export type AppRouter = typeof appRouter
