import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { reminderQueue } from "../../lib/queue";

const applicationStatusEnum = z.enum([
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "accepted",
]);

export const applicationRouter = router({
  // Flow 3: Log an application (jobPostingId/resumeId optional)
  create: protectedProcedure
    .input(
      z.object({
        company: z.string().min(1),
        role: z.string().min(1),
        notes: z.string().optional(),
        jobPostingId: z.string().optional(),
        resumeId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { jobPostingId, resumeId, ...rest } = input;

      // "Never trust a client-supplied ID belongs to the requester" —
      // check ownership of BOTH optional links before we ever touch the
      // Application table. Run them concurrently since they're
      // independent reads.
      const [postingOk, resumeOk] = await Promise.all([
        jobPostingId
          ? ctx.prisma.jobPosting.findFirst({ where: { id: jobPostingId, userId }, select: { id: true } })
          : Promise.resolve(true),
        resumeId
          ? ctx.prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true } })
          : Promise.resolve(true),
      ]);

      if (!postingOk) throw new TRPCError({ code: "NOT_FOUND", message: "Job posting not found" });
      if (!resumeOk) throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });

      // Single transaction: create the Application AND its first
      // StatusChange row together, so the history log starts from
      // creation ("saved" at t=0) rather than only appearing once the
      // user makes their first explicit status change.
      return ctx.prisma.$transaction(async (tx) => {
        const application = await tx.application.create({
          data: { ...rest, jobPostingId, resumeId, userId, status: "saved" },
        });

        await tx.statusChange.create({
          data: { applicationId: application.id, status: "saved" },
        });

        return application;
      });
    }),

  // Needed for the main dashboard / list view
  list: protectedProcedure
    .input(
      z
        .object({
          status: applicationStatusEnum.optional(),
          jobPostingId: z.string().optional(), // flow 7: compare across applications on same posting
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.application.findMany({
        where: {
          userId: ctx.session.user.id,
          status: input?.status,
          jobPostingId: input?.jobPostingId,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const application = await ctx.prisma.application.findUnique({
      where: { id: input.id },
      include: { statusLog: { orderBy: { changedAt: "asc" } } },
    });

    if (!application || application.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return application;
  }),

  // Flow 4 (partial): edit notes/company/role/links to posting or resume.
  // Deliberately does NOT accept `status` — see updateStatus below.
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        company: z.string().min(1).optional(),
        role: z.string().min(1).optional(),
        notes: z.string().optional(),
        jobPostingId: z.string().nullable().optional(),
        resumeId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, jobPostingId, resumeId, ...rest } = input;

      // Same ownership check as create, but only for links actually
      // being changed (skip the check — and allow — explicit `null`,
      // which means "unlink").
      const [postingOk, resumeOk] = await Promise.all([
        jobPostingId
          ? ctx.prisma.jobPosting.findFirst({ where: { id: jobPostingId, userId }, select: { id: true } })
          : Promise.resolve(true),
        resumeId
          ? ctx.prisma.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true } })
          : Promise.resolve(true),
      ]);

      if (!postingOk) throw new TRPCError({ code: "NOT_FOUND", message: "Job posting not found" });
      if (!resumeOk) throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });

      const result = await ctx.prisma.application.updateMany({
        where: { id, userId },
        data: { ...rest, jobPostingId, resumeId },
      });

      if (result.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.application.findUniqueOrThrow({ where: { id } });
    }),

  // Flow 4: Update application status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: applicationStatusEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.prisma
        .$transaction(async (tx) => {
          // updateMany inside the transaction, same ownership-in-WHERE
          // pattern as elsewhere — if this matches 0 rows the app either
          // doesn't exist or isn't the caller's, and the whole transaction
          // rolls back (no orphaned StatusChange row gets written).
          const result = await tx.application.updateMany({
            where: { id: input.id, userId },
            data: { status: input.status },
          });

          if (result.count === 0) {
            throw new TRPCError({ code: "NOT_FOUND" });
          }

          await tx.statusChange.create({
            data: { applicationId: input.id, status: input.status },
          });

          // Cancel-on-rejection hook. Note this uses a DIFFERENT ordering
          // than reminder.cancel's single-item cancel above, deliberately:
          //   - reminder.cancel is a direct user action on ONE reminder —
          //     Redis first, then Postgres, so a crash mid-way leaves a
          //     stuck-but-visible "pending" row rather than a reminder
          //     that fires despite Postgres saying cancelled.
          //   - This hook is a SIDE EFFECT of an unrelated action (a
          //     status change) and can affect MULTIPLE reminders at once.
          //     We don't want a Redis network call inside this DB
          //     transaction (holding row locks open across external I/O
          //     is its own hazard), and we don't want the application's
          //     status update to fail/rollback just because Redis is
          //     briefly unreachable. So: Postgres is the source of truth
          //     here, updated atomically with the status change, and the
          //     actual BullMQ removal happens as a best-effort step right
          //     after the transaction commits (below).
          let cancelledReminderIds: string[] = [];
          if (input.status === "rejected" || input.status === "withdrawn") {
            const pending = await tx.reminderJob.findMany({
              where: { applicationId: input.id, status: "pending" },
              select: { id: true, bullJobId: true },
            });

            if (pending.length > 0) {
              await tx.reminderJob.updateMany({
                where: { id: { in: pending.map((r) => r.id) } },
                data: { status: "cancelled" },
              });
              cancelledReminderIds = pending.map((r) => r.bullJobId).filter((id): id is string => id !== null);
            }
          }

          const application = await tx.application.findUniqueOrThrow({ where: { id: input.id } });
          return { application, cancelledReminderIds };
        })
        .then(async ({ application, cancelledReminderIds }) => {
          // Outside the transaction, after commit. Failures here are
          // logged, not thrown — Postgres already reflects "cancelled"
          // (the correct state), so a Redis hiccup shouldn't surface as
          // an error on what the user experiences as "I changed a
          // status." Worst case: a job briefly orphaned in Redis with no
          // matching pending Postgres row — the worker (see
          // reminderWorker.ts) re-checks Postgres status before sending
          // and no-ops if it's not still "pending," so this can't result
          // in an actual reminder firing after cancellation.
          await Promise.all(
            cancelledReminderIds.map(async (bullJobId) => {
              try {
                const bullJob = await reminderQueue.getJob(bullJobId);
                await bullJob?.remove();
              } catch (err) {
                console.error(`Failed to remove BullMQ job ${bullJobId} after status cancel:`, err);
              }
            }),
          );
          return application;
        });
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Cascades: StatusChange rows + ReminderJob rows for this application
    const result = await ctx.prisma.application.deleteMany({
      where: { id: input.id, userId: ctx.session.user.id },
    });

    if (result.count === 0) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return { id: input.id };
  }),
});
