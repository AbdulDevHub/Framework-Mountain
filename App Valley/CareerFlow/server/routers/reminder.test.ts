import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { reminderRouter } from "./reminder";
import type { Context } from "../trpc";

// Mocked so no real Redis connection is opened — what we care about is
// the ORDER the router calls these in relative to the Postgres calls,
// which a mock lets us assert directly instead of trusting the code.
vi.mock("../../lib/queue", () => ({
  reminderQueue: {
    add: vi.fn(),
    getJob: vi.fn(),
  },
}));

// Same reasoning as application.test.ts: server/trpc.ts pulls in the
// real Auth.js config just to build createContext, which this test
// never calls — mocked out so its module graph (which needs a real
// Next.js runtime) doesn't get exercised here.
vi.mock("../../lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("../../lib/prisma", () => ({
  prisma: {},
}));

import { reminderQueue } from "../../lib/queue";

function makeFakePrisma() {
  const prisma = {
    application: { findFirst: vi.fn() },
    reminderJob: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  };
  return prisma;
}

function makeCaller(prisma: ReturnType<typeof makeFakePrisma>, userId = "user-1") {
  const ctx = {
    session: { user: { id: userId } },
    prisma,
  } as unknown as Context;
  return reminderRouter.createCaller(ctx);
}

describe("reminder.schedule — write to Postgres before enqueuing to BullMQ", () => {
  let prisma: ReturnType<typeof makeFakePrisma>;
  const calls: string[] = [];

  beforeEach(() => {
    prisma = makeFakePrisma();
    calls.length = 0;
    vi.mocked(reminderQueue.add).mockReset();

    prisma.application.findFirst.mockResolvedValue({ id: "app-1" });

    prisma.reminderJob.create.mockImplementation(async () => {
      calls.push("postgres.create");
      return { id: "rem-1" };
    });

    vi.mocked(reminderQueue.add).mockImplementation(async () => {
      calls.push("bullmq.add");
      return { id: "bull-1" } as never;
    });

    prisma.reminderJob.update.mockImplementation(async () => {
      calls.push("postgres.update");
      return { id: "rem-1", bullJobId: "bull-1" };
    });
  });

  it("creates the Postgres row (bullJobId: null) BEFORE the BullMQ job is enqueued", async () => {
    const caller = makeCaller(prisma);
    await caller.schedule({ applicationId: "app-1", scheduledFor: new Date(Date.now() + 60_000) });

    // The crash-safety property under test: if the process died between
    // these two calls, the durable Postgres row already exists (visibly
    // stuck at bullJobId: null) rather than a BullMQ job with no
    // matching database record at all. Asserting exact order — not just
    // that both happened — is what actually verifies that guarantee.
    expect(calls).toEqual(["postgres.create", "bullmq.add", "postgres.update"]);
  });

  it("creates the row with bullJobId still null at the time of the Postgres insert", async () => {
    const caller = makeCaller(prisma);
    await caller.schedule({ applicationId: "app-1", scheduledFor: new Date(Date.now() + 60_000) });

    expect(prisma.reminderJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        applicationId: "app-1",
        status: "pending",
      }),
    });
  });

  it("writes the returned BullMQ job id back onto the Postgres row after enqueueing", async () => {
    const caller = makeCaller(prisma);
    await caller.schedule({ applicationId: "app-1", scheduledFor: new Date(Date.now() + 60_000) });

    expect(prisma.reminderJob.update).toHaveBeenCalledWith({
      where: { id: "rem-1" },
      data: { bullJobId: "bull-1" },
    });
  });

  it("never enqueues to BullMQ for an application the caller doesn't own", async () => {
    prisma.application.findFirst.mockResolvedValue(null);

    const caller = makeCaller(prisma, "attacker");
    await expect(
      caller.schedule({ applicationId: "someone-elses-app", scheduledFor: new Date(Date.now() + 60_000) }),
    ).rejects.toThrow(TRPCError);

    expect(prisma.reminderJob.create).not.toHaveBeenCalled();
    expect(reminderQueue.add).not.toHaveBeenCalled();
  });
});

describe("reminder.cancel — remove from BullMQ before marking cancelled in Postgres", () => {
  let prisma: ReturnType<typeof makeFakePrisma>;
  const calls: string[] = [];

  beforeEach(() => {
    prisma = makeFakePrisma();
    calls.length = 0;
    vi.mocked(reminderQueue.getJob).mockReset();
  });

  it("removes the BullMQ job BEFORE updating Postgres to cancelled", async () => {
    prisma.reminderJob.findFirst.mockResolvedValue({
      id: "rem-1",
      userId: "user-1",
      status: "pending",
      bullJobId: "bull-1",
    });
    const remove = vi.fn(async () => {
      calls.push("bullmq.remove");
    });
    vi.mocked(reminderQueue.getJob).mockImplementation(async () => {
      return { remove } as never;
    });
    (prisma.reminderJob as unknown as { update: ReturnType<typeof vi.fn> }).update = vi.fn(async () => {
      calls.push("postgres.update");
      return { id: "rem-1", status: "cancelled" };
    });

    const caller = makeCaller(prisma);
    await caller.cancel({ id: "rem-1" });

    // Deliberately the mirror image of schedule()'s ordering: a crash
    // here should leave Postgres still saying "pending" (visible,
    // debuggable) rather than "cancelled" while the job is still live in
    // Redis and could still fire.
    expect(calls).toEqual(["bullmq.remove", "postgres.update"]);
  });

  it("is a no-op that doesn't touch BullMQ for an already-terminal reminder", async () => {
    prisma.reminderJob.findFirst.mockResolvedValue({
      id: "rem-1",
      userId: "user-1",
      status: "sent",
      bullJobId: "bull-1",
    });

    const caller = makeCaller(prisma);
    const result = await caller.cancel({ id: "rem-1" });

    expect(reminderQueue.getJob).not.toHaveBeenCalled();
    expect(result.status).toBe("sent");
  });

  it("throws NOT_FOUND for a reminder that isn't the caller's", async () => {
    prisma.reminderJob.findFirst.mockResolvedValue(null);

    const caller = makeCaller(prisma, "attacker");
    await expect(caller.cancel({ id: "someone-elses-reminder" })).rejects.toThrow(TRPCError);
  });
});
