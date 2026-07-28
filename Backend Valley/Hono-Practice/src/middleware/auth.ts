import { MiddlewareHandler } from "hono"
import { verifyToken, extractBearerToken, InvalidTokenError } from "../lib/auth"

// We extend Hono's context "Variables" type so TypeScript knows that
// c.get("userId") and c.get("email") are valid and what type they return.
// This is called "declaration merging" — we're adding to an existing type.
declare module "hono" {
  interface ContextVariableMap {
    userId: string
    email: string
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = extractBearerToken(c.req.header("Authorization"))

  if (!token) {
    return c.json({ error: "Missing or malformed Authorization header" }, 401)
  }

  try {
    const payload = verifyToken(token)

    // Store the decoded values on the context so route handlers can read them
    // e.g. c.get("userId") inside a tasks route
    c.set("userId", payload.userId)
    c.set("email", payload.email)

    await next() // token is valid — let the request through
  } catch (err) {
    if (err instanceof InvalidTokenError) {
      return c.json({ error: err.message }, 401)
    }
    throw err // something unexpected — let it bubble to your error handler
  }
}
