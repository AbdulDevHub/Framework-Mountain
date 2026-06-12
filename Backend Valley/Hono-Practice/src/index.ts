import { Hono } from 'hono'
import { tasksRouter } from './routes/tasks'
import { authRouter } from './routes/auth'
import { authMiddleware } from './middleware/auth'

const app = new Hono()

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