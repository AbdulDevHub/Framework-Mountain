import { Hono } from 'hono'
import { tasksRouter } from './routes/tasks'
import { authMiddleware } from './middleware/auth'

const app = new Hono()

// Routes first
app.get('/', (c) => {
  return c.json({ message: 'Hello from Hono!' })
})

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