import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { router, publicProcedure } from "../trpc";

export const authRouter = router({
  // Not one of the original 11 flows explicitly, but required for flow 1
  // (sign up / log in) to actually work with the Credentials provider.
  // publicProcedure because you're not logged in yet when you sign up.
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      // If a user already exists with this email — including one that
      // signed up via GitHub OAuth and has no password yet — refuse.
      // (Account-linking, i.e. "add a password to my existing OAuth
      // account," is a real feature but a separate one; out of scope
      // for Day 3.)
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // 10 salt rounds is bcrypt's usual default — enough cost to slow
      // down brute-forcing without making every login noticeably slow.
      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await ctx.prisma.user.create({
        data: { email: input.email, name: input.name, hashedPassword },
      });

      // Deliberately NOT returning hashedPassword, obviously — but also
      // not logging the user in here. Signup and login are kept as two
      // separate steps: this mutation creates the account, then the
      // client calls Auth.js's signIn("credentials", ...) with the same
      // email/password right after, which is what actually sets the
      // session cookie. Keeps this router from needing to know anything
      // about Auth.js internals.
      return { id: user.id, email: user.email };
    }),
});
