import { Worker } from 'bullmq'

const connection = {
  host: 'localhost',
  port: 6379,
}

const worker = new Worker(
  'email',                    // must match the queue name in queue.js
  async (job) => {
    console.log(`Processing job ${job.id}:`, job.data)

    // Simulate doing actual work (e.g. calling an email API)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log(`Job ${job.id} completed!`)
  },
  { connection }
)

console.log('Worker is running, waiting for jobs...')

worker.on('completed', (job) => console.log(`✓ Job ${job.id} done`))
worker.on('failed', (job, err) => console.log(`✗ Job ${job.id} failed:`, err.message))