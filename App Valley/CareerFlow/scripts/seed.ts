import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeMatchScores } from "../lib/matching";

// ─────────────────────────────────────────────
// Why this talks to Prisma directly, not through tRPC
// ─────────────────────────────────────────────
// Every mutation in server/routers/ goes through auth checks and Zod
// validation because it's handling input from an untrusted network
// request. A seed script isn't a request from anyone — it's you,
// running trusted code, directly against your own database. Going
// through tRPC here would mean faking a session and a network round
// trip for no actual benefit. That said, it still has to respect the
// same relational shape the app expects (e.g. an Application's `status`
// field should actually match its last StatusChange row) — Prisma
// doesn't enforce that for you, the app's logic does, so this script
// has to reproduce it by hand where it matters.

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@careerflow.app";
const DEMO_PASSWORD = "demo-password-123"; // fine to be simple/public — this is seeded demo data, not a real account

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  // ── Idempotency: wipe any previous demo user and start fresh ──
  // User -> JobPosting/Resume/Application/ReminderJob are all
  // onDelete: Cascade (see schema.prisma), and THOSE cascade further
  // (Application -> StatusChange, Resume/JobPosting -> MatchResult) —
  // so deleting the User row alone is enough to clear everything from
  // a previous run. Re-running this script is always safe.
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log("Removed previous demo user and all their data.");
  }

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const demoUser = await prisma.user.create({
    data: { email: DEMO_EMAIL, name: "Demo User", hashedPassword },
  });

  // ── Resumes ──
  // Two deliberately different resumes, so match scores against
  // different postings actually vary — a seed with generic filler text
  // would make every score look similar and defeat the point of a demo.
  const backendResume = await prisma.resume.create({
    data: {
      userId: demoUser.id,
      label: "Backend-focused",
      text: "Backend engineer with 6 years of experience building distributed systems in Node.js and TypeScript. Deep expertise in PostgreSQL schema design, query optimization, and Redis-backed caching and job queues. Built and operated microservices handling millions of requests per day, with a strong focus on observability using OpenTelemetry and structured logging. Experienced with Docker, Kubernetes, and CI/CD pipelines. Comfortable owning services end to end, from API design through production incident response.",
    },
  });

  const fullstackResume = await prisma.resume.create({
    data: {
      userId: demoUser.id,
      label: "Full-stack",
      text: "Full-stack developer with 5 years shipping user-facing products end to end. Strong in React, TypeScript, and Next.js on the frontend, with REST and GraphQL API integration on the backend. Passionate about accessible, responsive UI design and component-driven development. Experience running usability tests, iterating on design systems, and collaborating closely with product and design teams to ship polished features quickly.",
    },
  });

  // ── Job postings ──
  const backendPosting = await prisma.jobPosting.create({
    data: {
      userId: demoUser.id,
      title: "Backend Engineer",
      company: "Riverbed Systems",
      description:
        "We are looking for a Backend Engineer to help scale our core platform. You will design and build distributed services in Node.js and TypeScript, working closely with PostgreSQL and Redis to handle high-throughput workloads. Responsibilities include API design, query optimization, and improving observability across our microservices. Experience with Docker, Kubernetes, and production incident response is a strong plus. You'll own services end to end and collaborate with a small, senior engineering team.",
    },
  });

  const frontendPosting = await prisma.jobPosting.create({
    data: {
      userId: demoUser.id,
      title: "Frontend Engineer",
      company: "Lumen Digital",
      description:
        "Lumen Digital is hiring a Frontend Engineer to build accessible, responsive interfaces in React and TypeScript. You'll work within a component-driven design system, collaborate closely with product and design on usability, and help ship polished user-facing features. Experience with Next.js and REST API integration is a plus. We value clean UI craftsmanship and fast iteration.",
    },
  });

  const fullstackPosting = await prisma.jobPosting.create({
    data: {
      userId: demoUser.id,
      title: "Full Stack Developer",
      company: "Nimbus Cloud",
      description:
        "Nimbus Cloud seeks a Full Stack Developer comfortable across the entire stack — React and TypeScript on the frontend, Node.js and PostgreSQL on the backend. You'll design REST APIs, build responsive UI components, and help scale a growing SaaS product end to end. Familiarity with Redis caching and CI/CD pipelines is a plus. We're a small team where everyone ships across the whole stack.",
    },
  });

  // Deliberately has no application AND no match result — shows up in
  // the demo's job postings list as an "unmatched" posting, which is a
  // realistic and useful state to demonstrate (not every posting you
  // save gets applied to or scored right away).
  await prisma.jobPosting.create({
    data: {
      userId: demoUser.id,
      title: "DevOps Engineer",
      company: "Ironclad Infra",
      description:
        "Ironclad Infra is looking for a DevOps Engineer to own our Kubernetes infrastructure, Terraform-managed AWS environment, and CI/CD tooling. You'll build observability dashboards, manage secrets and access policies, and drive infrastructure cost optimization across multiple environments. Strong bash and Python scripting skills required.",
    },
  });

  // ── Applications, with realistic status history ──
  // Written directly (application.create + statusChange.createMany)
  // rather than one StatusChange per status via separate calls, so we
  // can backdate changedAt to tell a believable multi-week story —
  // the real updateStatus mutation always uses "now", which wouldn't
  // let us seed a history that looks like it happened over time.

  const app1 = await prisma.application.create({
    data: {
      userId: demoUser.id,
      jobPostingId: backendPosting.id,
      resumeId: backendResume.id,
      company: backendPosting.company,
      role: backendPosting.title,
      status: "interviewing", // must match the LAST status change below
      createdAt: daysAgo(10),
    },
  });
  await prisma.statusChange.createMany({
    data: [
      { applicationId: app1.id, status: "saved", changedAt: daysAgo(10) },
      { applicationId: app1.id, status: "applied", changedAt: daysAgo(8) },
      { applicationId: app1.id, status: "interviewing", changedAt: daysAgo(2) },
    ],
  });

  const app2 = await prisma.application.create({
    data: {
      userId: demoUser.id,
      jobPostingId: frontendPosting.id,
      resumeId: fullstackResume.id,
      company: frontendPosting.company,
      role: frontendPosting.title,
      status: "rejected",
      createdAt: daysAgo(15),
    },
  });
  await prisma.statusChange.createMany({
    data: [
      { applicationId: app2.id, status: "saved", changedAt: daysAgo(15) },
      { applicationId: app2.id, status: "applied", changedAt: daysAgo(14) },
      { applicationId: app2.id, status: "rejected", changedAt: daysAgo(5) },
    ],
  });

  const app3 = await prisma.application.create({
    data: {
      userId: demoUser.id,
      jobPostingId: fullstackPosting.id,
      resumeId: fullstackResume.id,
      company: fullstackPosting.company,
      role: fullstackPosting.title,
      status: "saved",
      createdAt: daysAgo(1),
    },
  });
  await prisma.statusChange.create({
    data: { applicationId: app3.id, status: "saved", changedAt: daysAgo(1) },
  });

  // ── Match scores ──
  // Computed with the SAME function the real app uses (lib/matching.ts)
  // against the actual seeded text above — not hardcoded numbers. This
  // also doubles as a smoke test that pg_trgm is actually enabled and
  // working in your database; if the extension isn't set up, this is
  // where you'd find out.
  //
  // Four pairs, not just the three that have applications — resume1
  // (backend) vs the frontend posting is included deliberately, to show
  // a clearly LOW score alongside the good matches. Contrast is the
  // whole point of a demo; four similar-looking high scores wouldn't
  // show what the matching actually does.
  const pairs = [
    { resume: backendResume, jobPosting: backendPosting }, // expect: high
    { resume: fullstackResume, jobPosting: frontendPosting }, // expect: high
    { resume: fullstackResume, jobPosting: fullstackPosting }, // expect: moderate-high
    { resume: backendResume, jobPosting: frontendPosting }, // expect: low — the contrast case
  ];

  for (const { resume, jobPosting } of pairs) {
    const { ftsScore, trigramScore } = await computeMatchScores(prisma, resume.text, jobPosting.description);
    await prisma.matchResult.create({
      data: {
        resumeId: resume.id,
        jobPostingId: jobPosting.id,
        ftsScore,
        trigramScore,
        resumeUpdatedAtSnapshot: resume.updatedAt,
        jobPostingUpdatedAtSnapshot: jobPosting.updatedAt,
      },
    });
    console.log(
      `  scored "${resume.label}" vs "${jobPosting.title}": fts=${ftsScore.toFixed(3)}, trigram=${trigramScore.toFixed(3)}`,
    );
  }

  console.log("\nSeed complete.");
  console.log(`Demo user id: ${demoUser.id}`);
  console.log(`Set this in .env:  DEMO_USER_ID="${demoUser.id}"`);
  console.log(`\n(You can also log in as this user directly: ${DEMO_EMAIL} / ${DEMO_PASSWORD})`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
