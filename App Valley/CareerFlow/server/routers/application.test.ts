import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { applicationRouter } from "./application";
import type { Context } from "../trpc";

// The reminder queue is only touched by updateStatus's cancel-on-rejection
// hook (a Redis call outside the DB transaction) — mocked so these tests
// never open a real Redis connection, and so we can assert it's called
// with the right job ids.
vi.mock("../../lib/queue", () => ({
  reminderQueue: {
    getJob: vi.fn(),
  },
}));

// server/trpc.ts imports lib/auth.ts (real Auth.js/NextAuth config) at
// module load time purely to build createContext — irrelevant to these
// router tests, which construct ctx by hand, and NextAuth's own module
// graph doesn't resolve cleanly outside a real Next.js runtime.
vi.mock("../../lib/auth", () => ({
  auth: vi.fn(),
}));

// Same reasoning: server/trpc.ts also imports the real Prisma
// singleton (which requires a generated Prisma client / real
// DATABASE_URL) purely to build createContext — irrelevant here since
// these tests supply their own fake prisma via ctx.
vi.mock("../../lib/prisma", () => ({
  prisma: {},
}));

import { reminderQueue } from "../../lib/queue";

// A hand-rolled fake Prisma client instead of a mocking library — the
// router only ever touches a handful of methods, and being explicit
// about which ones makes the ownership assertions below easy to read.
// $transaction just runs the callback against the same fake client,
// which is enough for these tests since we're not testing Prisma's own
// transactional guarantees, only that the router passes the right
// `where` clauses into it.
function makeFakePrisma() {
  const prisma = {
    jobPosting: { findFirst: vi.fn() },
    resume: { findFirst: vi.fn() },
    application: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    statusChange: { create: vi.fn() },
    reminderJob: { findMany: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return prisma;
}

function makeCaller(prisma: ReturnType<typeof makeFakePrisma>, userId = "user-1") {
  const ctx = {
    session: { user: { id: userId } },
    prisma,
  } as unknown as Context;
  return applicationRouter.createCaller(ctx);
}

describe("application.update — ownership-enforced write", () => {
  let prisma: ReturnType<typeof makeFakePrisma>;

  beforeEach(() => {
    prisma = makeFakePrisma();
  });

  it("scopes the updateMany by both id AND the caller's userId", async () => {
    prisma.application.updateMany.mockResolvedValue({ count: 1 });
    prisma.application.findUniqueOrThrow.mockResolvedValue({ id: "app-1", company: "Acme" });

    const caller = makeCaller(prisma, "user-1");
    await caller.update({ id: "app-1", company: "New Name" });

    expect(prisma.application.updateMany).toHaveBeenCalledWith({
      where: { id: "app-1", userId: "user-1" },
      data: expect.objectContaining({ company: "New Name" }),
    });
  });

  it("throws NOT_FOUND — not a silent no-op — when the row belongs to someone else", async () => {
    // This is the whole point of updateMany-scoped-by-userId: a request
    // for someone else's application row matches zero rows rather than
    // updating it. The router must surface that as an error, not return
    // success for a write that didn't happen.
    prisma.application.updateMany.mockResolvedValue({ count: 0 });

    const caller = makeCaller(prisma, "attacker");
    await expect(caller.update({ id: "someone-elses-app", company: "Hijacked" })).rejects.toThrow(TRPCError);

    expect(prisma.application.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("rejects linking to a jobPosting the caller doesn't own before ever touching the Application row", async () => {
    prisma.jobPosting.findFirst.mockResolvedValue(null); // not found for this userId

    const caller = makeCaller(prisma, "user-1");
    await expect(caller.update({ id: "app-1", jobPostingId: "someone-elses-posting" })).rejects.toThrow(TRPCError);

    expect(prisma.jobPosting.findFirst).toHaveBeenCalledWith({
      where: { id: "someone-elses-posting", userId: "user-1" },
      select: { id: true },
    });
    expect(prisma.application.updateMany).not.toHaveBeenCalled();
  });
});

describe("application.delete — ownership-enforced write", () => {
  let prisma: ReturnType<typeof makeFakePrisma>;

  beforeEach(() => {
    prisma = makeFakePrisma();
  });

  it("scopes deleteMany by id AND userId", async () => {
    prisma.application.deleteMany.mockResolvedValue({ count: 1 });

    const caller = makeCaller(prisma, "user-1");
    await caller.delete({ id: "app-1" });

    expect(prisma.application.deleteMany).toHaveBeenCalledWith({
      where: { id: "app-1", userId: "user-1" },
    });
  });

  it("throws NOT_FOUND when deleteMany matches nothing (wrong owner or missing row)", async () => {
    prisma.application.deleteMany.mockResolvedValue({ count: 0 });

    const caller = makeCaller(prisma, "attacker");
    await expect(caller.delete({ id: "someone-elses-app" })).rejects.toThrow(TRPCError);
  });
});

describe("application.updateStatus — ownership-enforced write inside a transaction", () => {
  let prisma: ReturnType<typeof makeFakePrisma>;

  beforeEach(() => {
    prisma = makeFakePrisma();
    vi.mocked(reminderQueue.getJob).mockReset();
  });

  it("scopes the status updateMany by id AND userId, and records the status-change history row", async () => {
    prisma.application.updateMany.mockResolvedValue({ count: 1 });
    prisma.reminderJob.findMany.mockResolvedValue([]);
    prisma.application.findUniqueOrThrow.mockResolvedValue({ id: "app-1", status: "applied" });

    const caller = makeCaller(prisma, "user-1");
    await caller.updateStatus({ id: "app-1", status: "applied" });

    expect(prisma.application.updateMany).toHaveBeenCalledWith({
      where: { id: "app-1", userId: "user-1" },
      data: { status: "applied" },
    });
    expect(prisma.statusChange.create).toHaveBeenCalledWith({
      data: { applicationId: "app-1", status: "applied" },
    });
  });

  it("throws NOT_FOUND and rolls back — no orphaned StatusChange row — when the row isn't the caller's", async () => {
    prisma.application.updateMany.mockResolvedValue({ count: 0 });

    const caller = makeCaller(prisma, "attacker");
    await expect(caller.updateStatus({ id: "someone-elses-app", status: "applied" })).rejects.toThrow(TRPCError);

    expect(prisma.statusChange.create).not.toHaveBeenCalled();
  });

  it("cancels pending reminders in BullMQ, best-effort, after rejecting an application", async () => {
    prisma.application.updateMany.mockResolvedValue({ count: 1 });
    prisma.reminderJob.findMany.mockResolvedValue([
      { id: "rem-1", bullJobId: "bull-1" },
      { id: "rem-2", bullJobId: "bull-2" },
    ]);
    prisma.application.findUniqueOrThrow.mockResolvedValue({ id: "app-1", status: "rejected" });
    const remove = vi.fn();
    vi.mocked(reminderQueue.getJob).mockResolvedValue({ remove } as never);

    const caller = makeCaller(prisma, "user-1");
    await caller.updateStatus({ id: "app-1", status: "rejected" });

    expect(prisma.reminderJob.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["rem-1", "rem-2"] } },
      data: { status: "cancelled" },
    });
    expect(reminderQueue.getJob).toHaveBeenCalledWith("bull-1");
    expect(reminderQueue.getJob).toHaveBeenCalledWith("bull-2");
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
