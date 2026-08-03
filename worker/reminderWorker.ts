import "../lib/otel-worker-init"; // must be first import - see that file for why
import { Worker, Job } from "bullmq";
import { SpanStatusCode } from "@opentelemetry/api";
import { PrismaClient } from "@prisma/client";
import { redisConnection, REMINDER_QUEUE_NAME, ReminderJobPayload } from "../lib/queue";
import { tracer, extractTraceContext } from "../lib/otel";

// This worker is a SEPARATE Node process from the Next.js server (run
// via `node worker/reminderWorker.js` or similar, see package.json
// script) — not something that runs inside a Next.js route handler.
// It needs its own PrismaClient rather than importing lib/prisma.ts's
// singleton, because that singleton's globalThis-caching trick is
// specifically about surviving Next.js's dev hot-reload, which doesn't
// apply here; a plain client is simpler and correct for a long-lived
// standalone process.
const prisma = new PrismaClient();

async function sendReminder(applicationId: string, userId: string) {
  // "Delivery" in this product = making the follow-up durable and
  // visible in-app. This product intentionally does NOT push out-of-band
  // channels (email/push); the reminder is surfaced through the app's
  // own UI — the reminders page (status flips to "sent") and the
  // dashboard's "Recent reminders" activity section, both of which read
  // the Postgres ReminderJob row the caller updates below. So all this
  // function needs to do is log what "went out"; the actual durable
  // record of the send is the status + sentAt flip the caller applies.
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { company: true, role: true },
  });
  console.log(`[reminder] Follow up on ${application?.company ?? "?"} — ${application?.role ?? "?"} (user ${userId})`);
}

const worker = new Worker<ReminderJobPayload>(
  REMINDER_QUEUE_NAME,
  async (job: Job<ReminderJobPayload>) => {
    const { reminderJobId, applicationId, userId, otelTraceContext } = job.data;

    // This is the "extract" half of the inject/extract handoff described
    // in lib/otel.ts — starting the span inside the context extracted
    // from the payload makes it a CHILD of the API's original
    // reminder.schedule span, even though this is a different process
    // running possibly days later.
    const parentContext = extractTraceContext(otelTraceContext);

    return tracer.startActiveSpan("reminder.process", {}, parentContext, async (span) => {
      try {
        span.setAttribute("reminder.id", reminderJobId);

        // Re-check status before doing anything. This is the guard
        // referenced in application.ts's updateStatus comment: if the
        // application was rejected/withdrawn after this job was already
        // picked up by a worker (race between "worker starts" and
        // "cancel hook runs"), this row will already say "cancelled" —
        // in which case, no-op instead of sending.
        const reminderJob = await prisma.reminderJob.findUnique({ where: { id: reminderJobId } });
        if (!reminderJob) {
          span.addEvent("reminder_row_missing");
          return;
        }
        if (reminderJob.status !== "pending") {
          span.addEvent("skipped_not_pending", { status: reminderJob.status });
          return;
        }

        await sendReminder(applicationId, userId);

        await prisma.reminderJob.update({
          where: { id: reminderJobId },
          data: { status: "sent", sentAt: new Date() },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        span.recordException(err instanceof Error ? err : new Error(message));
        span.setStatus({ code: SpanStatusCode.ERROR, message });

        // Only mark "failed" in Postgres once BullMQ has exhausted its
        // own retries (attempts: 3 in lib/queue.ts) — job.attemptsMade
        // is 1-indexed and reflects the CURRENT attempt, so compare
        // against the job's configured attempts. Otherwise attempt 1's
        // failure would mark the row failed even though BullMQ is about
        // to retry it, which would misrepresent state to anyone viewing
        // the reminder list mid-retry.
        if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
          await prisma.reminderJob.update({
            where: { id: reminderJobId },
            data: { status: "failed", failureReason: message },
          });
        }

        throw err; // re-throw so BullMQ knows this attempt failed (and retries if attempts remain)
      } finally {
        span.end();
      }
    });
  },
  { connection: redisConnection, concurrency: 5 },
);

worker.on("failed", (job, err) => {
  console.error(`[reminder] job ${job?.id} failed:`, err.message);
});

console.log("[reminder] worker started, listening on queue:", REMINDER_QUEUE_NAME);

process.on("SIGTERM", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
