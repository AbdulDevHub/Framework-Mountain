import { Worker } from 'bullmq'

const connection = { host: 'localhost', port: 6379 }

const worker = new Worker(
  'email',
  async (job) => {
    console.log(`→ Started  job ${job.id} (${job.data.to})`)

    // Simulate slow work — like an HTTP request to a scraping target
    await new Promise((resolve) => setTimeout(resolve, 3000))

    console.log(`✓ Finished job ${job.id} (${job.data.to})`)
  },
  {
    connection,
    concurrency: 2,   // ← the only new thing
  }
)

console.log('Worker running with concurrency: 2')

worker.on('completed', (job) => console.log(`  [done] job ${job.id}`))