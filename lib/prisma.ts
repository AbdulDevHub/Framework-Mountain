import { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────
// Prisma singleton
// ─────────────────────────────────────────────
// Why this exists: in Next.js dev mode, modules get hot-reloaded on every
// file save. If you just did `export const prisma = new PrismaClient()`
// at the top level, every reload would create a *new* PrismaClient, and
// each one opens its own connection pool — you'd exhaust Postgres's
// connection limit within a few minutes of editing code.
//
// The fix: stash the client on `globalThis` (which survives hot reloads,
// since it's not part of the module graph that gets re-evaluated) and
// reuse it if it's already there. In production, there's no hot reload,
// so this just behaves like a normal singleton.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
