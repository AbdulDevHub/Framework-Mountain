import { MiddlewareHandler } from "hono"
import jwt from "jsonwebtoken"

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
  // JWTs are conventionally sent in the Authorization header like:
  //   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
  // We split on the space and take the second part.
  const authHeader = c.req.header("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or malformed Authorization header" }, 401)
  }

  const token = authHeader.split(" ")[1] // grab the token after "Bearer "

  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")

  try {
    // jwt.verify() does two things:
    //  1. Checks the signature — was this token signed with OUR secret?
    //     If someone tampered with the payload, the signature won't match.
    //  2. Checks expiry — is the token still within its expiresIn window?
    // If either fails, it throws an error and we catch it below.
    const payload = jwt.verify(token, secret) as { userId: string; email: string }

    // Store the decoded values on the context so route handlers can read them
    // e.g. c.get("userId") inside a tasks route
    c.set("userId", payload.userId)
    c.set("email", payload.email)

    await next() // token is valid — let the request through
  } catch (err) {
    // JsonWebTokenError  → signature invalid / token malformed
    // TokenExpiredError  → token is past its expiresIn date
    // Both mean: not authorized
    return c.json({ error: "Invalid or expired token" }, 401)
  }
}