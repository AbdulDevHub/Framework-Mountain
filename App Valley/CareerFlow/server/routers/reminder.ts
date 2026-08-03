import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { reminderQueue } from "../../lib/queue";
import { tracer, injectTraceContext } from "../../lib/otel";

export const reminderRouter = router({
  // Flow 8: Queue an application follow-up reminder
  schedule: protectedProcedure
    .input(
      // z.coerce.date() instead of z.date(): the tRPC transport uses
      // plain JSON (no superjson), so a Date sent from the client
      // arrives here as an ISO string. coerce accepts both — strings
      // get parsed, Dates pass through untouched.
      z.object({
        applicationId: z.string(),
        scheduledFor: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // This span is the ROOT of the trace that continues into the
      // worker later. Everything below — the DB write, the enqueue —
      // happens inside it, and its context gets serialized into the job
      // payload so the worker can pick up as a child span.
      return tracer.startActiveSpan("reminder.schedule", async (span) => {
        try {
          const application = await ctx.prisma.application.findFirst({
            where: { id: input.applicationId, userId },
            select: { id: true },
          });
          if (!application) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
          }

          // Step 1: create the Postgres row FIRST, with bullJobId still
          // null. This is the crash-safety ordering from the handoff —
          // if the process dies right after this line, worst case is a
          // row visibly stuck at bullJobId: null (debuggable), rather
          // than a BullMQ job with no durable record at all (invisible).
          const reminderJob = await ctx.prisma.reminderJob.create({
            data: {
              userId,
              applicationId: input.applicationId,
              scheduledFor: input.scheduledFor,
              status: "pending",
            },
          });

          // Step 2: capture the CURRENT trace context (this span) to
          // hand to the worker, then enqueue. BullMQ's own `delay`
          // option (not a cron) is how "fire at scheduledFor" works —
          // delay is milliseconds from now, so we compute the diff.
          const delay = Math.max(0, input.scheduledFor.getTime() - Date.now());

          const bullJob = await reminderQueue.add(
            "send-reminder",
            {
              reminderJobId: reminderJob.id,
              applicationId: input.applicationId,
              userId,
              otelTraceContext: injectTraceContext(),
            },
            { delay, jobId: reminderJob.id }, // jobId = reminderJob.id: convenient 1:1 mapping, also makes cancel() below trivial
          );

          // Step 3: write the BullMQ job id back onto the row, closing
          // the loop so cancel() later has something to look up.
          const updated = await ctx.prisma.reminderJob.update({
            where: { id: reminderJob.id },
            data: { bullJobId: bullJob.id ?? null },
          });

          span.setAttribute("reminder.id", reminderJob.id);
          span.setAttribute("reminder.scheduledFor", input.scheduledFor.toISOString());
          return updated;
        } finally {
          span.end();
        }
      });
    }),

  // Flow 9: View upcoming/past reminders
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["pending", "sent", "failed", "cancelled"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.reminderJob.findMany({
        where: { userId: ctx.session.user.id, status: input?.status },
        orderBy: { scheduledFor: "asc" },
        include: { application: { select: { id: true, company: true, role: true } } },
      });
    }),

  // Flow 10: Most recent sent reminders, for the dashboard activity list.
  // This is specific to the dashboard, so it lives here rather than
  // inflating application.ts — the reminder is the event being surfaced.
  recent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.reminderJob.findMany({
      where: { userId: ctx.session.user.id, status: "sent" },
      orderBy: { sentAt: "desc" },
      take: 5,
      include: { application: { select: { id: true, company: true, role: true } } },
    });
  }),

  cancel: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const reminderJob = await ctx.prisma.reminderJob.findFirst({
      where: { id: input.id, userId },
    });
    if (!reminderJob) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // Already terminal — nothing to cancel. Not an error: calling
    // cancel() on an already-sent/failed/cancelled reminder is a
    // reasonable no-op from the client's perspective (e.g. a double
    // click), not something worth surfacing as a failure.
    if (reminderJob.status !== "pending") {
      return reminderJob;
    }

    // Two systems, must both change or a "cancelled" reminder still
    // fires. Order: remove from BullMQ FIRST, then update Postgres.
    // Reasoning is the mirror image of schedule()'s ordering: if this
    // process crashes between the two steps, worst case here is a
    // BullMQ job that's already gone but Postgres still says
    // "pending" — visible/debuggable (a human sees a pending reminder
    // that inexplicably never sends, investigates, finds no
    // corresponding Bull job, and can safely mark it cancelled by
    // hand). The reverse order risks the opposite: Postgres says
    // "cancelled" while the job is still live in Redis and fires
    // anyway — a user gets an email for something they cancelled,
    // which is a worse failure mode than a stuck row.
    if (reminderJob.bullJobId) {
      const bullJob = await reminderQueue.getJob(reminderJob.bullJobId);
      // Job may already be gone (e.g. picked up by the worker in the
      // instant between our findFirst and here) — that's fine, it
      // means it's past the point of cancellation via Redis; the
      // status check below still protects the Postgres side.
      await bullJob?.remove();
    }

    return ctx.prisma.reminderJob.update({
      where: { id: input.id },
      data: { status: "cancelled" },
    });
  }),
});
