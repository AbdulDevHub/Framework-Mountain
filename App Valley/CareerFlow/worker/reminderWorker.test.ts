import { describe, it, expect, vi, beforeEach } from "vitest";

// The worker file has side effects at import time (starts OTel, opens a
// Redis connection, calls `new Worker(...)`) — every mock below exists
// to neutralize exactly one of those, so importing the file in a test
// process is safe and we're left with just the processor callback to
// test directly.

vi.mock("../lib/otel-worker-init", () => ({})); // skip real startOtel()

vi.mock("../lib/queue", () => ({
  redisConnection: {},
  REMINDER_QUEUE_NAME: "reminders",
}));

vi.mock("../lib/otel", () => ({
  tracer: {
    // Real tracer.startActiveSpan(name, opts, ctx, fn) — collapse straight
    // to calling fn with a fake span, no real OTel context machinery needed.
    startActiveSpan: (_name: string, _opts: unknown, _ctx: unknown, fn: (span: unknown) => unknown) =>
      fn({
        setAttribute: vi.fn(),
        addEvent: vi.fn(),
        recordException: vi.fn(),
        setStatus: vi.fn(),
        end: vi.fn(),
      }),
  },
  extractTraceContext: vi.fn(() => ({})),
}));

// Capture the processor function passed to `new Worker(name, processor, opts)`
// instead of letting BullMQ actually try to connect to Redis.
let capturedProcessor: (job: unknown) => Promise<unknown>;
vi.mock("bullmq", () => ({
  // Must be a real function so `new Worker(...)` in the worker module
  // works — see the PrismaClient mock below for the same constraint.
  Worker: vi.fn().mockImplementation(function (_name: string, processor: (job: unknown) => Promise<unknown>) {
    capturedProcessor = processor;
    return { on: vi.fn(), close: vi.fn() };
  }),
}));

const mockPrisma = {
  application: { findUnique: vi.fn() },
  reminderJob: { findUnique: vi.fn(), update: vi.fn() },
};
vi.mock("@prisma/client", () => ({
  // Must be a real function (not an arrow fn) so `new PrismaClient()` in
  // the worker module works — vitest's mock arrow-fn shorthand can't be
  // called with `new`.
  PrismaClient: vi.fn().mockImplementation(function () {
    return mockPrisma;
  }),
}));

function makeJob(overrides: Partial<{ attemptsMade: number; attempts: number }> = {}) {
  return {
    data: {
      reminderJobId: "rem-1",
      applicationId: "app-1",
      userId: "user-1",
      otelTraceContext: {},
    },
    attemptsMade: overrides.attemptsMade ?? 1,
    opts: { attempts: overrides.attempts ?? 3 },
  };
}

describe("reminderWorker processor — respects Postgres as the cancellation source of truth", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockPrisma.application.findUnique.mockResolvedValue({ company: "Acme", role: "Engineer" });
    // Import (or re-use the already-imported) worker module so
    // capturedProcessor is populated before each test.
    await import("./reminderWorker");
  });

  it("sends and marks the row sent when the reminder is still pending", async () => {
    mockPrisma.reminderJob.findUnique.mockResolvedValue({ id: "rem-1", status: "pending" });

    await capturedProcessor(makeJob());

    expect(mockPrisma.reminderJob.update).toHaveBeenCalledWith({
      where: { id: "rem-1" },
      data: expect.objectContaining({ status: "sent" }),
    });
  });

  it("no-ops without sending when the application was rejected/withdrawn after the job was enqueued", async () => {
    // application.ts's cancel-on-rejection hook flips this row to
    // "cancelled" out-of-band — the worker must re-check status itself
    // rather than trusting the job was still wanted when it was queued.
    mockPrisma.reminderJob.findUnique.mockResolvedValue({ id: "rem-1", status: "cancelled" });

    await capturedProcessor(makeJob());

    expect(mockPrisma.reminderJob.update).not.toHaveBeenCalled();
  });

  it("no-ops when the reminder row is missing entirely", async () => {
    mockPrisma.reminderJob.findUnique.mockResolvedValue(null);

    await capturedProcessor(makeJob());

    expect(mockPrisma.reminderJob.update).not.toHaveBeenCalled();
  });

  it("marks the row failed only once BullMQ's own retries are exhausted", async () => {
    mockPrisma.reminderJob.findUnique.mockResolvedValue({ id: "rem-1", status: "pending" });
    mockPrisma.application.findUnique.mockRejectedValueOnce(new Error("db unreachable"));

    // Final attempt (attemptsMade === attempts) — should mark failed and rethrow.
    await expect(capturedProcessor(makeJob({ attemptsMade: 3, attempts: 3 }))).rejects.toThrow("db unreachable");

    expect(mockPrisma.reminderJob.update).toHaveBeenCalledWith({
      where: { id: "rem-1" },
      data: { status: "failed", failureReason: "db unreachable" },
    });
  });

  it("rethrows without marking failed when BullMQ retries remain", async () => {
    mockPrisma.reminderJob.findUnique.mockResolvedValue({ id: "rem-1", status: "pending" });
    mockPrisma.application.findUnique.mockRejectedValueOnce(new Error("transient"));

    // Attempt 1 of 3 — BullMQ will retry, so Postgres shouldn't say
    // "failed" yet (that would misrepresent state to anyone viewing the
    // reminder list mid-retry).
    await expect(capturedProcessor(makeJob({ attemptsMade: 1, attempts: 3 }))).rejects.toThrow("transient");

    expect(mockPrisma.reminderJob.update).not.toHaveBeenCalled();
  });
});
