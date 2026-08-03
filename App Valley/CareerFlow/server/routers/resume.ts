import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";

export const resumeRouter = router({
  // Flow 5: Upload/edit resume text (create case)
  create: protectedProcedure
    .input(
      z.object({
        label: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.resume.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  // Needed to populate "select a resume variant" UI (flows 3, 6, 11)
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.resume.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const resume = await ctx.prisma.resume.findUnique({
      where: { id: input.id },
    });

    if (!resume || resume.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return resume;
  }),

  // Flow 5: Upload/edit resume text (edit case)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).optional(),
        text: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // IMPORTANT — this does NOT touch existing MatchResult rows, and
      // that's deliberate. The staleness design surfaces "outdated" by
      // comparing MatchResult.resumeUpdatedAtSnapshot against this row's
      // live `updatedAt` at READ time (Day 5's job). Recomputing is a
      // separate, explicit action the user takes later (flow 11) — this
      // mutation must not trigger it automatically, or every keystroke-
      // level edit would (eventually, via debounce or not) silently
      // spawn new MatchResult rows behind the user's back.
      const result = await ctx.prisma.resume.updateMany({
        where: { id, userId: ctx.session.user.id },
        data,
      });

      if (result.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.resume.findUniqueOrThrow({ where: { id } });
    }),

  // Day 7: preview before delete — same reasoning as jobPosting's
  // getDeleteImpact, but the two counts here mean DIFFERENT things,
  // and the confirmation UI needs to say so, not just show two numbers:
  //   - applicationCount: applications that will SURVIVE, just
  //     unlinked (resumeId -> null). Not a warning, more of an FYI.
  //   - matchResultCount: MatchResult rows that will be genuinely
  //     DELETED (cascade). This is the actual destructive part.
  getDeleteImpact: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const resume = await ctx.prisma.resume.findFirst({
      where: { id: input.id, userId },
      select: { id: true },
    });
    if (!resume) throw new TRPCError({ code: "NOT_FOUND" });

    const [applicationCount, matchResultCount] = await Promise.all([
      ctx.prisma.application.count({ where: { resumeId: input.id } }),
      ctx.prisma.matchResult.count({ where: { resumeId: input.id } }),
    ]);

    return { applicationCount, matchResultCount };
  }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Cascades: Application.resumeId -> null (app survives)
    //           MatchResult rows for this resume -> deleted (schema decision)
    // Frontend confirm step is getDeleteImpact() above — see the
    // comment in jobPosting.ts's delete() for why confirmation lives
    // in the UI rather than being enforced here.
    const result = await ctx.prisma.resume.deleteMany({
      where: { id: input.id, userId: ctx.session.user.id },
    });

    if (result.count === 0) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return { id: input.id };
  }),
});
