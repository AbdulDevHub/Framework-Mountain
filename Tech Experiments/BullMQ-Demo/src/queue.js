import { Queue } from 'bullmq'

const connection = { host: 'localhost', port: 6379 }

export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 2000,
    },
  },
})