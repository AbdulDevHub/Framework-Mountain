import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { computeMatchScores } from "./matching";

// computeMatchScores is a thin wrapper around ts_rank/similarity — real
// Postgres functions with no Prisma or JS equivalent. There's nothing
// meaningful to unit-test by mocking $queryRaw here (that would only
// prove the SQL string didn't change, not that the scoring logic is
// correct) — this needs an actual Postgres connection with pg_trgm
// enabled, same as the app itself requires.
//
// Run via: `npm run docker:up` (starts the same Postgres the app uses),
// then `npm test`. If Postgres isn't reachable, this suite is skipped
// rather than failing the whole run — the other suites don't need a
// database.

let prisma: PrismaClient;
let dbAvailable = false;

beforeAll(async () => {
  prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.runIf(dbAvailable)("computeMatchScores — FTS + trigram scoring against real Postgres", () => {
  it("gives a perfect trigram score for identical text", async () => {
    const text = "Senior backend engineer with distributed systems experience";
    const { trigramScore } = await computeMatchScores(prisma, text, text);
    expect(trigramScore).toBeCloseTo(1, 5);
  });

  it("ranks a resume that shares vocabulary with the posting above one that shares none", async () => {
    const jobDescription = "Looking for a backend engineer experienced with Postgres and distributed systems";
    const relevantResume = "Backend engineer, five years building distributed systems on Postgres";
    const irrelevantResume = "Watercolor painter and part-time barista with a love of gardening";

    const relevant = await computeMatchScores(prisma, relevantResume, jobDescription);
    const irrelevant = await computeMatchScores(prisma, irrelevantResume, jobDescription);

    expect(relevant.ftsScore).toBeGreaterThan(irrelevant.ftsScore);
    expect(relevant.trigramScore).toBeGreaterThan(irrelevant.trigramScore);
  });

  it("scores a near-miss typo above a completely unrelated word via trigram similarity", async () => {
    // FTS stems on whole words, so it can miss this; trigram similarity
    // is exactly the mechanism meant to catch it (per lib/matching.ts's
    // own comments on why the two scores are kept separate).
    const jobDescription = "Kubernetes and Docker orchestration experience required";
    const typoResume = "Experienced with Kubernettes and Docker orchestration";
    const unrelatedResume = "Baking sourdough bread professionally for eight years";

    const typo = await computeMatchScores(prisma, typoResume, jobDescription);
    const unrelated = await computeMatchScores(prisma, unrelatedResume, jobDescription);

    expect(typo.trigramScore).toBeGreaterThan(unrelated.trigramScore);
  });

  it("returns 0 for both scores, not null/NaN, when the job description is empty", async () => {
    const { ftsScore, trigramScore } = await computeMatchScores(prisma, "Some resume text here", "");
    expect(ftsScore).toBe(0);
    expect(trigramScore).toBe(0);
  });

  it("returns 0 for both scores when the resume text is empty", async () => {
    const { ftsScore, trigramScore } = await computeMatchScores(prisma, "", "Some job description here");
    expect(ftsScore).toBe(0);
    expect(trigramScore).toBe(0);
  });

  it("keeps trigramScore within its documented 0-1 bound regardless of input length", async () => {
    const longResume = "Software engineer ".repeat(200);
    const longPosting = "Backend engineer wanted ".repeat(150);
    const { trigramScore } = await computeMatchScores(prisma, longResume, longPosting);
    expect(trigramScore).toBeGreaterThanOrEqual(0);
    expect(trigramScore).toBeLessThanOrEqual(1);
  });
});
