// scripts/seed-load-test.ts
//
// Creates a SEPARATE "load test" user (does not touch your demo user)
// and a configurable number of JobPosting rows with random lorem-ipsum
// text, purely so EXPLAIN ANALYZE against explain-analyze.sql reflects
// a realistic table size. Not meant to test match-scoring quality —
// just index usage.
//
// Run with:
//   npx tsx scripts/seed-load-test.ts
//   npx tsx scripts/seed-load-test.ts --count=500
//
// Safe to re-run: it wipes and recreates only the load-test user's data
// each time, same pattern as your existing scripts/seed.ts.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LOAD_TEST_EMAIL = "loadtest@careerflow.local";

const countArg = process.argv.find((a) => a.startsWith("--count="));
const ROW_COUNT = countArg ? parseInt(countArg.split("=")[1], 10) : 300;

// Small fixed word pool -> random lorem-ish sentences. No external
// dependency (no faker) needed just to generate filler text.
const WORDS = [
  "engineering", "platform", "backend", "frontend", "distributed",
  "systems", "cloud", "infrastructure", "product", "senior", "junior",
  "developer", "manager", "remote", "hybrid", "onsite", "team",
  "scalable", "microservices", "api", "database", "typescript",
  "python", "kubernetes", "pipeline", "analytics", "growth", "design",
  "mobile", "security", "compliance", "stakeholders", "roadmap",
  "agile", "sprint", "customer", "revenue", "architecture", "testing",
  "automation", "reliability", "latency", "throughput", "onboarding",
];

function randomSentence(minWords = 8, maxWords = 20): string {
  const n = minWords + Math.floor(Math.random() * (maxWords - minWords));
  const words = Array.from(
    { length: n },
    () => WORDS[Math.floor(Math.random() * WORDS.length)]
  );
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function randomDescription(): string {
  const paragraphs = 2 + Math.floor(Math.random() * 3); // 2-4 sentences worth
  return Array.from({ length: paragraphs }, () => randomSentence()).join(" ");
}

const COMPANIES = [
  "Acme Corp", "Northwind Systems", "Globex", "Initech", "Umbrella Labs",
  "Hooli", "Vandelay Industries", "Stark Industries", "Wayne Enterprises",
  "Wonka Digital",
];

function randomCompany(): string {
  return COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
}

async function main() {
  console.log(`Seeding load-test data: ${ROW_COUNT} JobPosting rows...`);

  // Clean up any previous load-test run first (cascades via schema
  // relations, same as scripts/seed.ts does for the demo user).
  const existing = await prisma.user.findUnique({
    where: { email: LOAD_TEST_EMAIL },
  });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log("Removed previous load-test user and their data.");
  }

  const user = await prisma.user.create({
    data: {
      email: LOAD_TEST_EMAIL,
      name: "Load Test User",
      // hashedPassword is optional in schema.prisma, so this user can't
      // log in via credentials — fine, since this script only needs an
      // owner id for the JobPosting rows, not a login-capable account.
    },
  });

  const BATCH_SIZE = 50;
  let created = 0;

  while (created < ROW_COUNT) {
    const batchSize = Math.min(BATCH_SIZE, ROW_COUNT - created);
    const batch = Array.from({ length: batchSize }, (_, i) => ({
      userId: user.id,
      title: `Load Test Posting ${created + i + 1}`,
      company: randomCompany(),
      description: randomDescription(),
    }));

    // createMany is much faster than N individual create() calls for
    // bulk inserts, but skips Prisma middleware/hooks if you have any.
    await prisma.jobPosting.createMany({ data: batch });
    created += batchSize;
    console.log(`  ${created}/${ROW_COUNT} rows created`);
  }

  console.log("Load-test seed complete.");
  console.log(`Load-test user id: ${user.id}`);
  console.log(`(Use this id in explain-analyze.sql in place of 'some-real-user-id')`);

  const sampleIds = await prisma.jobPosting.findMany({
    where: { userId: user.id },
    select: { id: true },
    take: 5,
  });
  console.log("Sample JobPosting ids for testing:");
  sampleIds.forEach((row) => console.log(`  ${row.id}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
