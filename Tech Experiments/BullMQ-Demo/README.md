# BullMQ Demo

A hands-on learning project for background job processing with BullMQ and Redis. Covers queues, workers, retry logic, and concurrency — the same producer/consumer pattern used in production systems like AWS SQS + Lambda.

## What this project demonstrates

- Adding jobs to a queue from an Express API route
- Processing jobs in a worker process
- Automatic retries with backoff when a job fails
- Concurrent job processing (multiple jobs running simultaneously)

## Prerequisites

- Node.js 18+
- Docker (to run Redis)

## Setup

**1. Start Redis**

```bash
docker run -d -p 6379:6379 redis:alpine
```

**2. Install dependencies**

```bash
npm install
```

## Project structure

```
src/
├── queue.js              # Queue definition — shared between server and workers
├── server.js             # Express API with POST /send-email route
├── worker.js             # Basic worker — processes jobs successfully
├── workerFail.js         # Worker with deliberate failures to demonstrate retry logic
└── workerConcurrent.js   # Worker with concurrency: 2 to process jobs in parallel
```

## Running the demos

Each demo requires two terminals running simultaneously: the server and a worker.

---

### Demo 1 — Basic queue and worker

**Terminal 1** (worker — just sits and listens):

```bash
node src/worker.js
```

**Terminal 2** (server):

```bash
node src/server.js
```

**Terminal 3** (send a job):

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/send-email" -ContentType "application/json" -Body '{"to": "test@example.com", "subject": "Hello BullMQ"}'
```

The API responds instantly with a job ID. The worker picks up the job, processes it, and logs completion.

---

### Demo 2 — Retry logic

The queue is configured with `attempts: 3` and a 2-second fixed backoff. `workerFail.js` deliberately throws an error on the first two attempts and succeeds on the third.

**Terminal 1:**

```bash
node src/workerFail.js
```

**Terminal 2:**

```bash
node src/server.js
```

**Terminal 3:**

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/send-email" -ContentType "application/json" -Body '{"to": "test@example.com", "subject": "Hello BullMQ"}'
```

Expected worker output (over ~4 seconds):

```
Attempt #1 for job 1 → fails
Attempt #2 for job 1 → fails
Attempt #3 for job 1 → succeeds
```

To see a permanently failed job, change `attempts: 3` to `attempts: 2` in `src/queue.js`. The job will exhaust all retries and move to BullMQ's failed bucket.

---

### Demo 3 — Concurrency

`workerConcurrent.js` sets `concurrency: 2`, meaning the worker holds two job slots open simultaneously. Each job takes 3 seconds, so sending 3 jobs at once shows jobs 1 and 2 starting together, with job 3 waiting for a slot to open.

**Terminal 1:**

```bash
node src/workerConcurrent.js
```

**Terminal 2:**

```bash
node src/server.js
```

**Terminal 3** (send 3 jobs at once):

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/send-email" -ContentType "application/json" -Body '{"to": "a@test.com", "subject": "Job A"}'
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/send-email" -ContentType "application/json" -Body '{"to": "b@test.com", "subject": "Job B"}'
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/send-email" -ContentType "application/json" -Body '{"to": "c@test.com", "subject": "Job C"}'
```

Expected worker output:

```
→ Started  job 1 (a@test.com)
→ Started  job 2 (b@test.com)   ← jobs 1 and 2 run simultaneously
✓ Finished job 1 (a@test.com)
→ Started  job 3 (c@test.com)   ← slot opens, job 3 starts immediately
✓ Finished job 2 (b@test.com)
✓ Finished job 3 (c@test.com)
```

Change `concurrency: 2` to `concurrency: 1` to see each job wait for the previous one to finish.

## How retry logic works

Retry configuration lives on the **Queue** (in `src/queue.js`), not the worker. This means retry rules travel with the job in Redis and are honored by any worker that picks it up.

```js
defaultJobOptions: {
  attempts: 3,
  backoff: {
    type: 'fixed',   // or 'exponential' to double the delay each time
    delay: 2000,     // milliseconds between retries
  },
}
```

## Mapping to AWS (the InsideDesk model)

This project mirrors the architecture used in production scraping systems:

| This project | AWS equivalent | Role |
|---|---|---|
| `POST /send-email` | API Gateway + Lambda trigger | Receives request, hands off work |
| `emailQueue.add()` | `sqs.sendMessage()` | Puts a job in the queue |
| Redis | SQS | Stores jobs and tracks state |
| Worker process | Lambda consumer | Picks up and processes jobs |
| `concurrency: 2` | Lambda reserved concurrency | Parallel job slots |
| `attempts` + `backoff` | SQS visibility timeout + DLQ | Retry before giving up |
| Failed bucket | Dead Letter Queue (DLQ) | Permanent failures for inspection |

## Things to explore next

- **Bull Board** — a visual dashboard for queues: `npm install @bull-board/express`
- **Job progress** — report progress mid-job with `job.updateProgress(50)`
- **Priorities** — urgent jobs jump the queue: `emailQueue.add('send', data, { priority: 1 })`
- **Repeatable jobs** — cron-style scheduling: `{ repeat: { cron: '0 9 * * *' } }`
- **Exponential backoff** — more realistic retry delays: `backoff: { type: 'exponential', delay: 1000 }`
