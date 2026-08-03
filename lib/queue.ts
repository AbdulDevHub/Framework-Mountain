import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

// ─────────────────────────────────────────────
// Redis connection + queue singleton
// ─────────────────────────────────────────────
// Same globalThis trick as lib/prisma.ts, same reason: Next.js dev hot
// reload would otherwise open a new Redis connection (and a new BullMQ
// Queue instance, which itself opens connections) on every file save.
//
// maxRetriesPerRequest: null is BullMQ's own recommendation for the
// connection it uses — without it, ioredis's default retry behavior can
// cause BullMQ's blocking commands to throw instead of just waiting.

const globalForQueue = globalThis as unknown as {
  redisConnection: IORedis | undefined;
  reminderQueue: Queue<ReminderJobPayload> | undefined;
};

export const redisConnection =
  globalForQueue.redisConnection ??
  new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.redisConnection = redisConnection;
}

// What the worker needs to do its job, plus otelTraceContext so the
// worker can pick up the same distributed trace the API request started
// (see instrumentation note in reminder.ts schedule()).
export type ReminderJobPayload = {
  reminderJobId: string; // Postgres ReminderJob.id — the FK the worker updates
  applicationId: string;
  userId: string;
  otelTraceContext?: Record<string, string>;
};

export const REMINDER_QUEUE_NAME = "reminders";

export const reminderQueue =
  globalForQueue.reminderQueue ??
  new Queue<ReminderJobPayload>(REMINDER_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      // BullMQ's own retry, separate from the Postgres row's
      // "failed" status — if all 3 attempts fail, the worker's catch
      // block (see worker/reminderWorker.ts) marks the row failed with
      // the last error's message. Backoff to avoid hammering whatever
      // the failure was (e.g. an email provider outage) 3x back-to-back.
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      // Completed/failed jobs stay in Redis unless cleaned up — cap how
      // many we keep around. The durable record is the Postgres row
      // anyway; Redis history here is just for BullMQ's own dashboard/debugging.
      removeOnComplete: { count: 1_000 },
      removeOnFail: { count: 5_000 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.reminderQueue = reminderQueue;
}
