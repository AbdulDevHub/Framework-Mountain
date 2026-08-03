import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { env } from "../../lib/env";

// Flow 10: Public, unauthenticated, read-only demo view.
//
// Every procedure here is read-only by design — this router should
// never contain a .mutation(). A reviewer poking at the public demo
// shouldn't be able to alter seeded data for other visitors.

function requireDemoUserId(): string {
  if (!env.DEMO_USER_ID) {
    // This is a config problem, not a client error — the demo route
    // was hit before anyone seeded a demo user and set DEMO_USER_ID.
    // INTERNAL_SERVER_ERROR (not NOT_FOUND) is the honest code here:
    // nothing the caller did was wrong.
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Demo is not configured yet (DEMO_USER_ID unset).",
    });
  }
  return env.DEMO_USER_ID;
}

export const demoRouter = router({
  jobPostings: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.jobPosting.findMany({
      where: { userId: requireDemoUserId() },
      orderBy: { createdAt: "desc" },
    });
  }),

  applications: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.application.findMany({
      where: { userId: requireDemoUserId() },
      include: { statusLog: { orderBy: { changedAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  matchResults: publicProcedure.query(async ({ ctx }) => {
    const demoUserId = requireDemoUserId();

    // MatchResult has no userId column of its own — ownership flows
    // through its resume/jobPosting relations, same pattern as
    // match.getLatest/getHistory use for the authenticated versions.
    return ctx.prisma.matchResult.findMany({
      where: {
        resume: { userId: demoUserId },
        jobPosting: { userId: demoUserId },
      },
      orderBy: { computedAt: "desc" },
      include: {
        resume: { select: { label: true } },
        jobPosting: { select: { title: true, company: true } },
      },
    });
  }),
});
