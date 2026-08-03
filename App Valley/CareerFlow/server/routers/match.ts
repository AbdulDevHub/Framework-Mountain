import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { computeMatchScores } from "../../lib/matching";

export const matchRouter = router({
  // Flow 6: Compute match score (one resume <-> one posting), synchronous
  compute: protectedProcedure
    .input(
      z.object({
        resumeId: z.string(),
        jobPostingId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ownership check on BOTH ids — checking only one is a data-leak
      // bug (a user could score their resume against someone else's
      // posting text, or vice versa, learning something about content
      // they don't own).
      const [resume, jobPosting] = await Promise.all([
        ctx.prisma.resume.findFirst({
          where: { id: input.resumeId, userId },
          select: { text: true, updatedAt: true },
        }),
        ctx.prisma.jobPosting.findFirst({
          where: { id: input.jobPostingId, userId },
          select: { description: true, updatedAt: true },
        }),
      ]);

      if (!resume) throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });
      if (!jobPosting) throw new TRPCError({ code: "NOT_FOUND", message: "Job posting not found" });

      const { ftsScore, trigramScore } = await computeMatchScores(ctx.prisma, resume.text, jobPosting.description);

      // MatchResult is a HISTORY table — always insert a new row, never
      // upsert. Snapshots are taken from the updatedAt values fetched
      // ABOVE, in the same request, so they reflect exactly the resume
      // and posting content that were actually scored just now — not a
      // separately-timed read that could race with an edit.
      return ctx.prisma.matchResult.create({
        data: {
          resumeId: input.resumeId,
          jobPostingId: input.jobPostingId,
          ftsScore,
          trigramScore,
          resumeUpdatedAtSnapshot: resume.updatedAt,
          jobPostingUpdatedAtSnapshot: jobPosting.updatedAt,
        },
      });
    }),

  // Flow 11: Re-run scores for multiple postings after a resume edit.
  // Still synchronous per the one-pager's reasoning — no queue needed.
  computeBatch: protectedProcedure
    .input(
      z.object({
        resumeId: z.string(),
        jobPostingIds: z.array(z.string()).min(1).max(50), // sane upper bound
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const resume = await ctx.prisma.resume.findFirst({
        where: { id: input.resumeId, userId },
        select: { text: true, updatedAt: true },
      });
      if (!resume) throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });

      // Ownership check covers EVERY id, not just the first — fetch all
      // matching (id AND userId), then compare counts. If any requested
      // id doesn't come back, it either doesn't exist or isn't this
      // user's — reject the whole batch rather than silently scoring
      // only the ones that passed (which would return fewer results
      // than requested with no explanation why).
      const postings = await ctx.prisma.jobPosting.findMany({
        where: { id: { in: input.jobPostingIds }, userId },
        select: { id: true, description: true, updatedAt: true },
      });
      if (postings.length !== input.jobPostingIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more job postings not found",
        });
      }

      // Score everything first (pure computation, no DB writes yet),
      // THEN insert all the MatchResult rows in one transaction — so
      // either every posting in the batch gets a new history row, or
      // none do, rather than a partial batch if something fails midway.
      const scored = await Promise.all(
        postings.map(async (jp) => ({
          jobPostingId: jp.id,
          jobPostingUpdatedAtSnapshot: jp.updatedAt,
          ...(await computeMatchScores(ctx.prisma, resume.text, jp.description)),
        })),
      );

      return ctx.prisma.$transaction(
        scored.map((s) =>
          ctx.prisma.matchResult.create({
            data: {
              resumeId: input.resumeId,
              jobPostingId: s.jobPostingId,
              ftsScore: s.ftsScore,
              trigramScore: s.trigramScore,
              resumeUpdatedAtSnapshot: resume.updatedAt,
              jobPostingUpdatedAtSnapshot: s.jobPostingUpdatedAtSnapshot,
            },
          }),
        ),
      );
    }),

  // Latest score for a pair, with staleness computed at read time by
  // comparing the stored snapshots against the live Resume/JobPosting
  // updatedAt values. This is where the "may be outdated, recompute?"
  // UI signal comes from.
  getLatest: protectedProcedure
    .input(
      z.object({
        resumeId: z.string(),
        jobPostingId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ownership enforced via the relation filters (resume: { userId },
      // jobPosting: { userId }) rather than a separate check — if either
      // id belongs to someone else, this simply matches nothing and
      // returns null, same as "no match computed yet." That collapse is
      // deliberate: it doesn't leak whether an ID exists but isn't
      // yours, vs. genuinely never having been scored — same principle
      // as the NOT_FOUND collapsing used elsewhere, just expressed as
      // null instead of a thrown error since "nothing computed yet" is
      // a normal state here, not a failure.
      const latest = await ctx.prisma.matchResult.findFirst({
        where: {
          resumeId: input.resumeId,
          jobPostingId: input.jobPostingId,
          resume: { userId },
          jobPosting: { userId },
        },
        orderBy: { computedAt: "desc" },
        include: {
          resume: { select: { updatedAt: true } },
          jobPosting: { select: { updatedAt: true } },
        },
      });

      if (!latest) return null;

      const isStale =
        latest.resumeUpdatedAtSnapshot.getTime() !== latest.resume.updatedAt.getTime() ||
        latest.jobPostingUpdatedAtSnapshot.getTime() !== latest.jobPosting.updatedAt.getTime();

      return { ...latest, isStale };
    }),

  // Full computation history for a pair (flow 7-adjacent: seeing how a
  // score changed as the resume was iterated on)
  getHistory: protectedProcedure
    .input(
      z.object({
        resumeId: z.string(),
        jobPostingId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.prisma.matchResult.findMany({
        where: {
          resumeId: input.resumeId,
          jobPostingId: input.jobPostingId,
          resume: { userId },
          jobPosting: { userId },
        },
        orderBy: { computedAt: "desc" },
      });
    }),
});
