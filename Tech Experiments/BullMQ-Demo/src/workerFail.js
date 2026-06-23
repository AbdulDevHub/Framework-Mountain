import { Worker } from 'bullmq'

const connection = { host: 'localhost', port: 6379 }

const worker = new Worker(
  'email',
  async (job) => {
    console.log(`\nAttempt #${job.attemptsMade + 1} for job ${job.id}`)
    console.log(`Data:`, job.data)

    if (job.attemptsMade < 2) {
      throw new Error('Something went wrong! (simulated failure)')
    }

    console.log(`✓ Job ${job.id} succeeded on attempt ${job.attemptsMade + 1}`)
  },
  { connection }  // ← just this, nothing else
)

console.log('Worker is running, waiting for jobs...')

worker.on('completed', (job) =>
  console.log(`✓ Completed after ${job.attemptsMade} retries`)
)

worker.on('failed', (job, err) =>
  console.log(`✗ Job ${job.id} permanently failed: ${err.message}`)
)