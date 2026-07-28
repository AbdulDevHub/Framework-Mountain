import prisma from "../lib/prisma"
import { verifyToken, extractBearerToken } from "../lib/auth"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"

export async function createContext({ req }: FetchCreateContextFnOptions) {
  let userId: string | null = null
  let email: string | null = null

  const token = extractBearerToken(req.headers.get("Authorization"))
  if (token) {
    try {
      const payload = verifyToken(token)
      userId = payload.userId
      email = payload.email
    } catch {
      // bad/expired token — leave userId null, protectedProcedure below will reject it
    }
  }

  return { prisma, userId, email }
}

export type Context = Awaited<ReturnType<typeof createContext>>
