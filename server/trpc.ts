import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Session } from "next-auth";
import type { PrismaClient } from "@prisma/client";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
// Built fresh on every request. `session` is null for unauthenticated
// requests (e.g. the public demo route) and populated for logged-in users.
export interface Context {
  session: Session | null;
  prisma: PrismaClient; // from your Prisma client singleton
}

// Called once per incoming request by the tRPC fetch adapter (wired up
// in app/api/trpc/[trpc]/route.ts). `auth()` reads the JWT out of the
// request cookies and verifies it — this is the ONE place session
// verification happens. Nothing downstream re-checks the JWT; they just
// trust ctx.session because it came from here.
export async function createContext(_opts: FetchCreateContextFnOptions): Promise<Context> {
  const session = await auth();
  return { session, prisma };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;

// Anyone can call this — no session required.
// Used for: the public demo route (flow 10), and nothing else.
export const publicProcedure = t.procedure;

// Requires a valid session. Throws UNAUTHORIZED before your handler
// ever runs if ctx.session is missing.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // Re-typed so every protectedProcedure handler knows
      // ctx.session.user is definitely present — no `?.` needed downstream.
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
