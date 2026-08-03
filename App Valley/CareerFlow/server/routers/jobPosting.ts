import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

export const jobPostingRouter = router({
  // Flow 2: Add a job posting
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        company: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.jobPosting.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  // List the current user's postings (not an explicit numbered flow,
  // but needed to populate the "select a posting" UI for flows 3, 6, 11)
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.jobPosting.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const posting = await ctx.prisma.jobPosting.findUnique({
      where: { id: input.id },
    });

    // Two failure modes collapse into the same NOT_FOUND: the row
    // doesn't exist, or it exists but belongs to someone else. Don't
    // distinguish these in the response — a distinct "exists but not
    // yours" error would let a client enumerate other users' IDs.
    if (!posting || posting.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return posting;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        company: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // updateMany (not update) so ownership is enforced in the WHERE
      // clause itself, atomically, rather than as a separate findUnique
      // check followed by a trusting update. Prisma's `update` throws if
      // the id alone doesn't match a row, but doesn't let you also
      // require userId in the same call — updateMany does.
      const result = await ctx.prisma.jobPosting.updateMany({
        where: { id, userId: ctx.session.user.id },
        data,
      });

      if (result.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.jobPosting.findUniqueOrThrow({ where: { id } });
    }),

  // Day 7: what the frontend calls BEFORE showing a delete confirmation
  // — a read-only preview of the blast radius. Separate from delete()
  // itself on purpose: this is a query (safe to call speculatively,
  // e.g. the moment a delete button is hovered/clicked, without
  // committing to anything), and it lets the confirmation dialog show
  // real numbers instead of a generic "are you sure?" that undersells
  // what cascading delete actually does here.
  getDeleteImpact: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const posting = await ctx.prisma.jobPosting.findFirst({
      where: { id: input.id, userId },
      select: { id: true },
    });
    if (!posting) throw new TRPCError({ code: "NOT_FOUND" });

    // Applications linked to this posting CASCADE on delete (schema
    // decision from Day 2) — these rows are actually destroyed, not
    // just unlinked, which is why this preview exists at all.
    const applicationCount = await ctx.prisma.application.count({
      where: { jobPostingId: input.id },
    });

    return { applicationCount };
  }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Same updateMany-style ownership enforcement, via deleteMany.
    // Reminder: this cascades to Application + MatchResult rows (schema decision).
    // The frontend confirm step is getDeleteImpact() above, called
    // before this — this mutation itself still doesn't ask "are you
    // sure," by design: enforcing confirmation at the API layer would
    // block any future non-interactive caller (a script, a bulk-
    // cleanup job) that already knows what it's doing. The confirm
    // step belongs in the UI, not the API contract.
    const result = await ctx.prisma.jobPosting.deleteMany({
      where: { id: input.id, userId: ctx.session.user.id },
    });

    if (result.count === 0) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return { id: input.id };
  }),
});
