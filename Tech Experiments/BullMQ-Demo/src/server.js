import express from 'express'
import { emailQueue } from './queue.js'

const app = express()
app.use(express.json())

app.post('/send-email', async (req, res) => {
  const { to, subject } = req.body

  // This is the key line — "add a ticket to the kitchen"
  const job = await emailQueue.add('send', { to, subject })

  res.json({ message: 'Job queued', jobId: job.id })
})

app.listen(3000, () => console.log('Server running on http://localhost:3000'))