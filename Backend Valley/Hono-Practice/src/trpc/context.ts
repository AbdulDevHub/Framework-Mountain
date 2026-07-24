import prisma from "../lib/prisma"
import { env } from "../lib/env"
import jwt from "jsonwebtoken"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"

export async function createContext({ req }: FetchCreateContextFnOptions) {
  let userId: string | null = null
  let email: string | null = null

  const authHeader = req.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as {
        userId: string
        email: string
      }
      userId = payload.userId
      email = payload.email
    } catch {
      // bad/expired token — leave userId null, protectedProcedure below will reject it
    }
  }

  return { prisma, userId, email }
}

export type Context = Awaited<ReturnType<typeof createContext>>
