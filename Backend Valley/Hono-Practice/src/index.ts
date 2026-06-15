import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { tasksRouter } from './routes/tasks'
import { authRouter } from './routes/auth'
import { authMiddleware } from './middleware/auth'
// import { secureHeaders } from './middleware/secureHeaders' // Custom secure headers middleware (commented out in favor of built-in one)
import { secureHeaders } from 'hono/secure-headers'
import { env } from './lib/env'

const app = new Hono()

// --- CORS ---
// Must be registered BEFORE routes so the headers are set on every response,
// including error responses. Hono middleware runs in the order it's added.
const ALLOWED_ORIGINS = env.ALLOWED_ORIGINS.split(',').filter(Boolean)

app.use('*', cors({
  origin: (requestOrigin) => {
    // Return the origin if it's on the allowlist, null = blocked
    return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : null
  },
  credentials: true,                // Required when your frontend sends Authorization headers
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,                    // Cache preflight for 24h so browsers don't repeat it
}))

// --- Security Headers ---
app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    frameAncestors: ["'none'"],
  },
  strictTransportSecurity: env.NODE_ENV === 'production'
    ? 'max-age=15552000; includeSubDomains'
    : false,
}))

// Public routes — no auth needed
app.get('/', (c) => {
  return c.json({ message: 'Hello from Hono!' })
})

app.route('/auth', authRouter)    // POST /auth/register, POST /auth/login

// Protected routes — JWT required
app.use('/tasks/*', authMiddleware)
app.route('/tasks', tasksRouter)

// Fallbacks last
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404)
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app