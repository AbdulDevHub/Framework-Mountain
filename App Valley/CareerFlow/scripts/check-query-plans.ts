// scripts/check-query-plans.ts
//
// Automates the full "does this query use an index?" check:
//   1. makes sure enough JobPosting rows exist to make the check
//      meaningful (creates a load-test user + rows if not)
//   2. pulls real ids straight from the database — no manual
//      copy-pasting into a .sql file
//   3. runs EXPLAIN ANALYZE on each of the 4 ownership-scoped queries
//      the app actually performs (see lib/matching.ts, application.ts,
//      jobPosting.ts, match.ts)
//   4. scans the plan text for "Seq Scan" and fails (non-zero exit
//      code) if it finds one, so this is safe to wire into CI later
//
// Run with:
//   npx tsx scripts/check-query-plans.ts
//
// This replaces manually running scripts/seed-load-test.ts, copying
// ids out with psql, hand-editing scripts/explain-analyze.sql, and
// piping it into psql. explain-analyze.sql is kept in the repo as a
// reference for what these queries are and why — see the comments
// there for the reasoning behind each one — but this script is the
// one to actually run day-to-day.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LOAD_TEST_EMAIL = "loadtest@careerflow.local";
const MIN_JOB_POSTINGS = 300; // below this, the planner correctly prefers a seq scan — see explain-analyze.sql

const WORDS = [
  "engineering", "platform", "backend", "frontend", "distributed",
  "systems", "cloud", "infrastructure", "product", "senior", "junior",
  "developer", "manager", "remote", "hybrid", "onsite", "team",
  "scalable", "microservices", "api", "database", "typescript",
  "python", "kubernetes", "pipeline", "analytics", "growth", "design",
];
const COMPANIES = [
  "Acme Corp", "Northwind Systems", "Globex", "Initech", "Umbrella Labs",
];

function randomSentence(): string {
  const n = 8 + Math.floor(Math.random() * 12);
  const words = Array.from({ length: n }, () => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
function randomDescription(): string {
  return Array.from({ length: 2 + Math.floor(Math.random() * 3) }, randomSentence).join(" ");
}
function randomCompany(): string {
  return COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
}

async function ensureLoadTestData(): Promise<{ userId: string; jobPostingIds: string[] }> {
  let user = await prisma.user.findUnique({ where: { email: LOAD_TEST_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: LOAD_TEST_EMAIL, name: "Load Test User" },
    });
  }

  const existingCount = await prisma.jobPosting.count({ where: { userId: user.id } });
  if (existingCount < MIN_JOB_POSTINGS) {
    const toCreate = MIN_JOB_POSTINGS - existingCount;
    console.log(`Load-test data below threshold (${existingCount}/${MIN_JOB_POSTINGS}) — creating ${toCreate} more JobPosting rows...`);
    const BATCH = 50;
    let created = 0;
    while (created < toCreate) {
      const size = Math.min(BATCH, toCreate - created);
      await prisma.jobPosting.createMany({
        data: Array.from({ length: size }, (_, i) => ({
          userId: user!.id,
          title: `Load Test Posting ${existingCount + created + i + 1}`,
          company: randomCompany(),
          description: randomDescription(),
        })),
      });
      created += size;
    }
  }

  const rows = await prisma.jobPosting.findMany({
    where: { userId: user.id },
    select: { id: true },
    take: 15,
  });

  return { userId: user.id, jobPostingIds: rows.map((r) => r.id) };
}

let anyFailed = false;

async function explainAndCheck(label: string, planRows: { "QUERY PLAN": string }[]) {
  const planText = planRows.map((r) => r["QUERY PLAN"]).join("\n");
  console.log(`\n── ${label} ──`);
  console.log(planText);

  if (/Seq Scan/i.test(planText)) {
    console.log("⚠️  SEQ SCAN DETECTED — this query is not using an index. Check the relevant @@index in schema.prisma.");
    anyFailed = true;
  } else if (/Index Scan|Bitmap/i.test(planText)) {
    console.log("✅ index used");
  } else {
    console.log("ℹ️  couldn't confirm scan type from plan text — inspect manually");
  }
}

async function main() {
  console.log("Checking query plans against realistic data volume...\n");

  const { userId, jobPostingIds } = await ensureLoadTestData();

  // 1. Resume + JobPosting single-row ownership lookups.
  // Use any existing real Resume if one exists (doesn't need to belong
  // to the load-test user — the index behavior is the same regardless
  // of which user owns the row).
  const resume = await prisma.resume.findFirst();
  if (resume) {
    const plan = await prisma.$queryRaw<{ "QUERY PLAN": string }[]>`
      EXPLAIN ANALYZE SELECT text, "updatedAt" FROM "Resume"
      WHERE id = ${resume.id} AND "userId" = ${resume.userId}
    `;
    await explainAndCheck("1a. Resume ownership lookup (match.compute)", plan);
  } else {
    console.log("\n── 1a. Resume ownership lookup ──\nSkipped: no Resume rows exist yet. Create one via the app or prisma db seed first.");
  }

  const jpPlan = await prisma.$queryRaw<{ "QUERY PLAN": string }[]>`
    EXPLAIN ANALYZE SELECT description, "updatedAt" FROM "JobPosting"
    WHERE id = ${jobPostingIds[0]} AND "userId" = ${userId}
  `;
  await explainAndCheck("1b. JobPosting ownership lookup (match.compute)", jpPlan);

  // 2. Batch lookup — the one that actually benefits from load-test volume.
  const batchIds = jobPostingIds.slice(0, 10);
  const batchPlan = await prisma.$queryRaw<{ "QUERY PLAN": string }[]>`
    EXPLAIN ANALYZE SELECT id, description, "updatedAt" FROM "JobPosting"
    WHERE id = ANY(${batchIds}) AND "userId" = ${userId}
  `;
  await explainAndCheck("2. JobPosting batch lookup (match.computeBatch)", batchPlan);

  // 3. MatchResult history lookup — needs a real, existing (resumeId, jobPostingId) pair.
  const matchResult = await prisma.matchResult.findFirst();
  if (matchResult) {
    const mrPlan = await prisma.$queryRaw<{ "QUERY PLAN": string }[]>`
      EXPLAIN ANALYZE SELECT * FROM "MatchResult"
      WHERE "resumeId" = ${matchResult.resumeId} AND "jobPostingId" = ${matchResult.jobPostingId}
      ORDER BY "computedAt" DESC
    `;
    await explainAndCheck("3. MatchResult history lookup (match.getHistory)", mrPlan);
  } else {
    console.log("\n── 3. MatchResult history lookup ──\nSkipped: no MatchResult rows exist yet. Run a match from the app first (or prisma db seed).");
  }

  console.log("\n" + "─".repeat(40));
  if (anyFailed) {
    console.log("❌ One or more queries hit a sequential scan. See above.");
    process.exitCode = 1;
  } else {
    console.log("✅ All checked queries are using an index.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
