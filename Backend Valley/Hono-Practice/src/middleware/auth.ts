import { MiddlewareHandler } from "hono"

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header("x-api-key")

  if (!apiKey) {
    return c.json({ error: "API key is missing" }, 401) // 401 = Unauthorized
  }

  if (apiKey !== process.env.API_KEY) {
    return c.json({ error: "Invalid API key" }, 403) // 403 = Forbidden
  }

  await next() // Call the next middleware or route handler
}
