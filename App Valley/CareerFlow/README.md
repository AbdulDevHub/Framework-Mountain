# CareerFlow — Job Application Tracker

> **Design system:** every component and page follows
> `context/ui-registry.md` — read it before touching any UI. Project
> conventions and non-negotiables live in `AGENTS.md`; current status and
> next steps live in `context/progress-tracker.md`.

## Screenshots

<details>
  <summary>Click to view screenshots</summary>

  <img src="./screenshots/Screenshot%20-%20Homepage.png" width="300" alt="Homepage">
  <img src="./screenshots/Screenshot%20-%20Dashboard.png" width="300" alt="Dashboard">
  <img src="./screenshots/Screenshot%20-%20Login.png" width="300" alt="Login">
  <img src="./screenshots/Screenshot%20-%20Application.png" width="300" alt="Application">
  <img src="./screenshots/Screenshot%20-%20Reminders.png" width="300" alt="Reminders">
</details>

## Codebase Guide

This doc explains **what each file does and why it exists**, at a level
that assumes you know how to code but haven't necessarily used tRPC,
Prisma, Auth.js, BullMQ, or OpenTelemetry before. It's a map, not a
tutorial — read it alongside the actual files.

---

## 1. The big picture

Your app is really **two separate running programs**:

1. **The Next.js server** — handles web requests. Someone's browser
   calls a URL, this program figures out what to do, talks to the
   database, and sends a response back.
2. **The worker** — a completely separate program that sits around
   waiting for reminder jobs to come due, then sends them. It doesn't
   respond to web requests at all. You start it separately
   (`pnpm run worker`).

Why split them? If reminders lived inside the web server, "send this
reminder in 3 days" would mean *something* has to stay running and
watching the clock — but web servers are built to handle requests and
return, not to sit and wait. So instead, the web server just writes
"send this at time X" to a queue (**Redis**, via **BullMQ**) and moves
on immediately. The worker is the thing that's always running,
watching that queue, and doing the actual sending when the time comes.

```
 Browser                Next.js server              Worker (separate process)
    │                        │                              │
    │ POST /api/trpc/...     │                              │
    │───────────────────────▶│                              │
    │                        │──▶ writes to Postgres         │
    │                        │──▶ pushes a job to Redis ────▶│ (waits, sometimes for days)
    │◀───────────────────────│                              │
    │  response              │                              │──▶ reads/writes Postgres
    │                        │                              │──▶ sends the reminder
```

Both processes talk to the **same Postgres database** — that's the
shared source of truth between them.

---

## 2. The libraries, in one sentence each

If a name here is unfamiliar, this is the "what problem does it solve"
version — not the full docs.

- **tRPC** — lets the frontend call backend functions (`create`,
  `list`, `update`...) like normal TypeScript functions, with full
  autocomplete and type-checking, instead of hand-writing REST
  endpoints and manually keeping frontend/backend types in sync.
- **Prisma** — lets you write `prisma.application.findMany({...})`
  instead of raw SQL, and generates TypeScript types straight from your
  database schema (`schema.prisma`).
- **Auth.js** (formerly NextAuth) — handles login: password checking,
  OAuth (e.g. "Sign in with GitHub"), and issuing the session token
  that proves who's logged in on each request.
- **BullMQ** — a job queue built on Redis. "Do this thing, but later"
  (a reminder scheduled for 3 days from now) or "do this thing in the
  background so the user doesn't wait for it."
- **Redis** — a fast in-memory database. BullMQ uses it to actually
  store the queue of pending jobs.
- **OpenTelemetry (OTel)** — instrumentation that records "what
  happened and how long did it take" as your code runs, so you can look
  at a timeline (a *trace*) later instead of guessing from scattered
  `console.log`s.

---

## 3. File-by-file

### Config & environment

**`docker-compose.yml`**
Spins up local Postgres and Redis in containers — just the infrastructure,
not the app itself. Your Next.js server and the worker still run
directly on your machine (`pnpm run dev`, `pnpm run worker`); they just
connect to the databases running inside Docker.

**`.env.example`**
A template listing every environment variable the app needs, with
comments explaining what each one is for and how to get real values
(e.g. where to create a GitHub OAuth app). Copy it to `.env` and fill
in real values — `.env` itself is gitignored and never committed.

**`lib/env.ts`**
Reads and validates every env var *once*, at startup, using the same
Zod library already used for tRPC input validation. If something's
missing or malformed, this throws immediately with a message naming
exactly which variable is wrong — instead of `undefined` silently
propagating into, say, the GitHub OAuth client and failing confusingly
three clicks later. Every other file that needs an env var imports
`env` from here rather than reading `process.env` directly.

### Database layer

**`schema.prisma`**
The database schema — every table (`User`, `JobPosting`, `Resume`,
`Application`, `StatusChange`, `MatchResult`, `ReminderJob`, `Account`)
and how they relate. This is the single source of truth for your data
shape; Prisma reads this file to generate the TypeScript client you use
everywhere else (`prisma.application.create(...)`, etc.).

**`lib/prisma.ts`**
Creates *one* Prisma client and reuses it everywhere, instead of a new
one per file. Necessary because of a quirk in Next.js dev mode (hot
reload re-runs files constantly, which would otherwise open a new
database connection pool every time you save a file). The `globalThis`
trick is the standard workaround — you'll see it again in `lib/queue.ts`
for the same reason.

### Auth layer

**`lib/auth.ts`**
Configures Auth.js: which login methods are supported (email/password,
GitHub OAuth), and two callbacks (`jwt`, `session`) that control what
information ends up in the session token. The key decision here is
**JWT sessions** — the login state lives entirely in an encrypted
cookie, not in a database table, so there's no `Session` model in
`schema.prisma`.

**`lib/next-auth.d.ts`**
Not logic — just tells TypeScript that `session.user.id` exists.
Auth.js's default types don't include `id`, but we add it in the
`session` callback above, so this file "teaches" TypeScript about that.

**`app/api/auth/[...nextauth]/route.ts`**
A thin adapter: Next.js expects auth endpoints (`/api/auth/signin`,
`/api/auth/callback/github`, etc.) to be wired up via a route file in
this exact folder structure. This file just hands off to Auth.js.

### API layer (tRPC)

**`server/trpc.ts`**
The foundation every router builds on. Defines:

- `createContext` — runs once per incoming request, checks "is this
  person logged in?" (via Auth.js), and hands the result (plus the
  Prisma client) to every procedure as `ctx`.
- `publicProcedure` — anyone can call it, logged in or not.
- `protectedProcedure` — throws an error immediately if `ctx.session`
  is empty, so individual routers don't have to repeat that check.

**`server/routers/_app.ts`**
Combines all the individual routers (`jobPosting`, `resume`,
`application`, `match`, `reminder`, `demo`, `auth`) into one
`appRouter`, and exports its TypeScript type (`AppRouter`) so the
frontend can get full autocomplete without importing any server code.

**`server/routers/jobPosting.ts`, `resume.ts`, `application.ts`,
`auth.ts`, `reminder.ts`**
Each file is one group of related backend functions ("procedures").
Recurring pattern worth internalizing: almost every `update`/`delete`
does `updateMany({ where: { id, userId } })` instead of `update({
where: { id } })` — baking the ownership check into the same database
call, rather than checking "is this yours?" first and trusting the
result. Two queries racing each other could slip through the gap
between a separate check and an update; one query can't race itself.

**`app/api/trpc/[trpc]/route.ts`**
Same idea as the auth route file — wires `appRouter` and
`createContext` into a URL Next.js can actually receive requests on.

### Smart matching (Postgres FTS + trigram, no AI)

**`lib/matching.ts`**
The actual scoring logic: one function, `computeMatchScores`, that runs
a raw SQL query using two different Postgres text-similarity
techniques — full-text search (`ts_rank`/`to_tsvector`) and trigram
similarity (`similarity()`, from the `pg_trgm` extension). Returns two
separate numbers rather than one blended score, on purpose — they
measure different kinds of similarity on different scales (one
unbounded, one 0–1), and blending them would hide that. Read the
comments in this file once, slowly — it's the most Postgres-specific
part of the codebase.

> **Why not just call an AI API?** This was a deliberate tradeoff, not
> a shortcut around one. An AI-based matcher would need an API key, a
> per-request cost, network latency, and non-deterministic output (the
> same resume/posting pair could score differently on two different
> days). Postgres FTS + trigram similarity is free, runs in the same
> query as everything else in this app, returns identical results for
> identical input every time (which matters for the `getHistory` view —
> a score changing over time should mean *the resume changed*, not that
> a model changed underneath you), and is fast enough to run
> synchronously in the request instead of needing a job queue. The
> honest tradeoff: it can't understand meaning the way an LLM can (it
> won't know "led a team of 5" and "management experience" are related
> unless the words overlap), so it will miss matches an AI reader
> would catch. For a resume/job-posting text-similarity task, that
> tradeoff — deterministic, free, instant, less semantically clever —
> was worth it.

**`server/routers/match.ts`**
`compute` (score one resume against one posting), `computeBatch` (same,
for up to 50 postings at once), `getLatest` (most recent score for a
pair, with a `isStale` flag computed by comparing stored snapshots
against the live resume/posting), `getHistory` (every score ever
computed for a pair, so you can see it change as you edit your resume).
`MatchResult` is a history table — every `compute` call inserts a new
row, it never overwrites the last one.

**`scripts/explain-analyze.sql`**
Not application code — a set of queries to run by hand (once you have
real seed data) to confirm the database is actually using indexes for
the lookups this router performs, rather than scanning full tables.
Has notes on why no GIN index was added for full-text/trigram search:
nothing in the current 11 flows searches across all postings by
content — every match procedure scores a specific, already-known pair.
That kind of index becomes necessary the day you add a "browse similar
postings" feature, not before; the file explains exactly what that
query and index would look like when you get there.

**`scripts/seed.ts`**
Creates one demo user with two contrasting resumes, four job postings,
three applications with realistic status history, and four match
scores — computed for real via `lib/matching.ts`'s `computeMatchScores`
against the actual seeded text, not hardcoded numbers. Wired up as
Prisma's official seed hook (the `"prisma": { "seed": ... }` entry in
`package.json`), so `npx prisma migrate reset` runs it automatically
too, not just `pnpm run db:seed`. Safe to re-run any time — it deletes
the previous demo user (which cascades away everything tied to them)
before recreating everything fresh.

### Frontend (App Router + tRPC React Query)

**`lib/trpc/client.ts`**
One line of actual logic (`createTRPCReact<AppRouter>()`) that generates
a fully-typed React hook for every procedure in every router — this is
the payoff of exporting `AppRouter`'s TYPE from `_app.ts` back on Day 2.

**`app/providers.tsx`**
Wraps the whole app in three things it needs: React Query's cache,
tRPC's client (pointed at `/api/trpc`), and Auth.js's `SessionProvider`
(so `useSession()` works in any Client Component). Read the comment on
`useState(() => new QueryClient())` — it looks like unnecessary
ceremony but it's actually preventing different users' data from
leaking into each other's cache during server rendering.

**`app/components/NavBar.tsx`**
Client Component (needs `useSession()`, so it must be) — shows
different links based on whether you're logged in.

**`app/login/page.tsx`, `app/signup/page.tsx`**
Credentials + GitHub login, and the signup form that calls the
`auth.signup` mutation from Day 3 (which had no frontend until now).

**`app/dashboard/page.tsx` + `app/dashboard/DashboardContent.tsx`**
Split into two files on purpose: `page.tsx` is a Server Component that
checks `auth()` and redirects before anything renders (the actual
security boundary), `DashboardContent.tsx` is a Client Component doing
the interactive data fetching via tRPC hooks. This split — Server
Component for the gate, Client Component for the interactivity — is
the pattern to repeat for any other protected page you add.

**`app/demo/page.tsx`**
The public flow-10 route — no auth gate needed, since `demo` router is
entirely `publicProcedure`.

**`app/components/ui/`**
The shared design-system primitives built in the portfolio polish
pass: `Button`, `Card`/`CardHeader`/`CardBody`, `StatusBadge`,
`Modal`, `ConfirmDeleteModal`, `EmptyState`, `Spinner`,
`FormFields`, `PageContainer`/`PageHeader`. New UI must compose these
(per `context/ui-registry.md`) — no inline styles.

**Delete flows**
Handled by `ConfirmDeleteModal` + the routers' `getDeleteImpact`
procedures. Clicking delete doesn't delete anything — it opens a modal
that shows the real blast radius before confirmation. Note the impact
copy is intentionally asymmetric (mirrors the schema): deleting a job
posting **cascades** its applications away entirely, but deleting a
resume only **unlinks** its applications (they survive) while its match
scores really do get deleted.

**`app/components/MatchScoreCard.tsx`**
The staleness-warning UI. Reads `match.getLatest` (which computes
`isStale` by comparing stored snapshots against live `updatedAt`
values), shows a warning banner + recompute button when stale, and a
"no score yet, compute one" state when nothing's been scored. This is
a standalone, reusable component — not tied to any one page.

**`app/applications/new/page.tsx`**
The one flow polished fully per the Day 7 handoff: pick or create a
job posting, pick or create a resume, log the application, then
`MatchScoreCard` takes over to show (or compute) the match score.
Every mutation on this page has its own loading state (`isPending`)
and its own inline error message — nothing here fails silently or
leaves you looking at a frozen button with no feedback.

### Background jobs (BullMQ)

**`lib/queue.ts`**
Defines the Redis connection and the `reminderQueue` — the actual queue
that `reminder.schedule` pushes jobs into and `worker/reminderWorker.ts`
pulls jobs out of. Also defines the *shape* of a job's data
(`ReminderJobPayload`) — what information the worker will have
available when it eventually runs.

**`worker/reminderWorker.ts`**
The standalone program mentioned in section 1. Run it with `pnpm run
worker` — it starts, connects to Redis, and then just sits there,
waking up whenever a job's scheduled time arrives (BullMQ handles the
"wait until 3 days from now" part). When a reminder fires, it
double-checks the reminder wasn't cancelled in the meantime, then sends
it, then updates the Postgres row to `sent`.

### Observability (OpenTelemetry)

**`lib/otel.ts`**
Starts the OpenTelemetry SDK. Both the web server and the worker call
this — same file, two different processes — so that both show up in
the same tracing backend, and so a trace can be stitched together
across the two of them (see the code comments in `reminder.ts` for how
that handoff works — it's the single trickiest concept in this
codebase, worth reading slowly once).

**`lib/otel-worker-init.ts`**
A one-line file whose only job is to be imported *first* in
`reminderWorker.ts`, so OTel's automatic instrumentation is active
before BullMQ/Redis code runs. See the comment inside — it's about how
JavaScript's `import` statements get hoisted before any other code
runs, which is a genuinely confusing gotcha worth understanding.

**`instrumentation.ts`**
Next.js's official, built-in hook for "run this once when the server
starts, before any requests." This is what triggers `lib/otel.ts` for
the *web server* process specifically (the worker triggers it via
`lib/otel-worker-init.ts` instead, since it's not a Next.js process).

---

## 4. Running it locally

**One-time setup:**

```bash
# 1. Copy the env template and fill in real values
cp .env.example .env.local
# - AUTH_SECRET: generate with `openssl rand -base64 32`
# - GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET: create an OAuth app at
#   https://github.com/settings/developers (see comments in .env.example
#   for the exact callback URL to register)

# 2. Install dependencies
pnpm install

# 3. Start Postgres + Redis via Docker
pnpm run docker:up

# 4. Create the database tables from schema.prisma
npx prisma generate
npx prisma migrate dev --name init

# 5. Seed a demo user with realistic data
pnpm run db:seed
# This prints a DEMO_USER_ID — copy it into .env, then restart `pnpm run dev`
# so the new env var is picked up. /demo will show the seeded data after that.
```

**Every time you work on the project**, two terminals:

```bash
# Terminal 1
pnpm run dev       # the web server

# Terminal 2
pnpm run worker    # the reminder worker
```

Docker (`pnpm run docker:up`) only needs to be run once per session —
Postgres and Redis keep running in the background until you stop them.

**Other Docker commands:**

```bash
pnpm run docker:down    # stop Postgres/Redis, keep the data
pnpm run docker:reset   # stop AND wipe all data — use when you want a clean database
```

**If something fails immediately on startup** with a message like
`Invalid or missing environment variables`, that's `lib/env.ts` doing
its job — read the message, it names exactly which variable is missing
or malformed. This is meant to happen at startup, not mid-request.

One more thing worth doing once, if you haven't: open `.gitignore` and
confirm it has an `.env` line (create-next-app's default one usually
covers `.env*.local` but not a bare `.env` — add it if it's not there).
`.env.example` is safe to commit (no real secrets); `.env` never is.

**The demo route (`/demo`) needs a seeded demo user.** Run
`pnpm run db:seed` (see section 4 above) — it prints the `DEMO_USER_ID`
to put in `.env`.

---

## 5. Testing

This section covers the Vitest suite added on top of the app — what's
tested, why those specific things and not everything, and how the
tricky parts (mocking a database, testing a Server Component, testing
two separate processes) actually work. It's written assuming you
haven't used Vitest much before.

### Why these four things, specifically

Not every file has a test — that's on purpose. The four things covered
are the ones where a bug would be a **security or correctness**
problem, not a polish problem, and where "I looked at the code and it
looks right" isn't a strong enough answer if someone asks how you know
it's actually correct:

1. **Ownership-enforced writes** (`server/routers/application.test.ts`) —
   if `updateMany({ where: { id, userId } })` ever accidentally became
   `updateMany({ where: { id } })`, one user could edit or delete
   another user's data. That's a real vulnerability class, not a typo
   that breaks a button.
2. **The Server-Component security gate** (`app/dashboard/page.test.tsx`) —
   this is the actual thing standing between an unauthenticated request
   and the dashboard. If it silently stopped redirecting, nothing else
   in the app would catch that.
3. **The two-process boundary** (`server/routers/reminder.test.ts`,
   `worker/reminderWorker.test.ts`) — the crash-safety of the whole
   reminder feature depends on the *order* `reminder.schedule` does
   things in (Postgres row created before the BullMQ job exists), and
   on the worker re-checking Postgres before it sends. Both of those
   are easy to get right by accident today and break silently in six
   months when someone "simplifies" the function.
4. **The matching scores** (`lib/matching.integration.test.ts`) — pure,
   deterministic, input-in/score-out logic. The easiest kind of bug to
   catch with a test, and the kind of thing that's embarrassing to get
   wrong in a portfolio piece someone might poke at.

Things like the UI components, the `list`/`getById` read queries, and
the OpenTelemetry instrumentation don't have tests — they're either low
risk if wrong (a broken read query fails loudly and immediately) or
mostly configuration rather than logic worth asserting on.

### How the router tests work: a fake Prisma, not a real database

`server/routers/application.test.ts` and `reminder.test.ts` never touch
Postgres. Instead, `ctx.prisma` is replaced with a plain object built
from `vi.fn()` — Vitest's mock function, which remembers every call
made to it (arguments, order, how many times) so a test can assert on
that later:

```ts
const prisma = {
  application: {
    updateMany: vi.fn(), // starts as "not called, returns undefined"
    // ...
  },
};
```

A test then tells a specific mock what to return —
`prisma.application.updateMany.mockResolvedValue({ count: 0 })`
simulates "this row didn't belong to the caller, zero rows matched" —
and calls the real router code (`applicationRouter.createCaller(ctx)`)
against that fake. This is the standard way to unit-test code that
talks to a database: you're testing *the router's logic* ("did it
throw `NOT_FOUND` when count was 0? did it scope the query by both `id`
and `userId`?"), not Prisma's or Postgres's behavior, which is
Prisma's/Postgres's own job to get right.

`lib/auth.ts` and `lib/prisma.ts` are also mocked in these files (see
the `vi.mock(...)` calls at the top) purely so importing the router
doesn't drag in the real Auth.js config or a real Prisma client — that
import chain needs a real Next.js runtime and a real `DATABASE_URL` to
even load, which a router-logic test shouldn't need to care about.

### How the dashboard gate test works: mocking `redirect()`

Next.js's real `redirect()` doesn't `return` — it `throw`s a special
internal error that Next's framework catches to stop rendering and send
a redirect response instead. The test mocks `redirect` to do the same
thing (throw), so `DashboardPage()` behaves exactly like it would in
production: nothing after `redirect()` ever runs. The test then asserts
two things for the no-session case: that `redirect` was called with
`/login`, and that calling the page function actually threw (proving
execution stopped there, rather than falling through to render).

### How the two-process ordering test works: asserting on order, not just presence

The important property of `reminder.schedule` isn't "it calls Postgres
and it calls BullMQ" — it's that it calls them in a *specific order*.
The test proves that by having each mocked call push a label into a
plain array, then checking the array afterward:

```ts
prisma.reminderJob.create.mockImplementation(async () => {
  calls.push("postgres.create");
  return { id: "rem-1" };
});
// ...
expect(calls).toEqual(["postgres.create", "bullmq.add", "postgres.update"]);
```

If someone later reordered the code (e.g. enqueued the BullMQ job
*before* writing the Postgres row, to "simplify" it), this test fails
immediately — instead of the bug only showing up as an occasional
orphaned BullMQ job discovered in production weeks later.

`worker/reminderWorker.test.ts` tests the other side of that boundary.
The tricky part there is that `worker/reminderWorker.ts` normally does
real work the instant it's imported — it opens a Redis connection,
starts OpenTelemetry, and calls `new Worker(...)`, which would try to
actually connect to Redis. Every `vi.mock(...)` at the top of that test
file exists to neutralize exactly one of those side effects (see the
comments in the file for which mock does what), so that importing the
file in a test is safe. The one exception is BullMQ's `Worker` itself:
instead of letting it run, the mock **captures the processor function**
it was given and hands it back to the test, so the test can call that
function directly with a fake job and assert on what it does — without
ever needing a real queue.

### How the matching tests work: real Postgres, not a mock

`lib/matching.ts` is the one place a fake database genuinely
wouldn't prove anything — `computeMatchScores` is a thin wrapper around
`ts_rank`/`similarity()`, real Postgres functions with no JavaScript
equivalent. Mocking `$queryRaw` to return a canned number would only
prove "the function returns what I told the mock to return," not that
the SQL is actually correct. So `lib/matching.integration.test.ts`
connects to a real Postgres instance (the same one `docker-compose.yml`
spins up, with `pg_trgm` enabled) and checks real properties of the
scoring, e.g.:

- identical text scores a perfect `1.0` on trigram similarity
- a resume that shares vocabulary with a job posting scores higher than
  one that doesn't, on both scores
- a typo ("Kubernettes") still scores well via trigram similarity, even
  though full-text search — which matches on whole word stems — misses
  it entirely (this is the actual reason the app keeps two separate
  scores instead of one)
- an empty resume or empty job description returns `0`, not `null` or
  an error

Every one of these assertions was manually verified against a live
Postgres 16 + `pg_trgm` instance while writing this suite (see the
exact `psql` queries and results in the PR/session notes) — so the
expected values aren't guesses. If Postgres isn't reachable when you
run the suite, this file skips itself (`describe.runIf(dbAvailable)`)
rather than failing the whole test run, since the other suites don't
need a database at all.

### Running the tests

```bash
pnpm test              # runs once, all suites
pnpm run test:watch    # re-runs on file changes

# The matching suite specifically needs Postgres running:
pnpm run docker:up
npx prisma generate   # only needed once, or after schema.prisma changes
pnpm test
```

---

## 6. What to read, and in what order, if you're lost

1. `schema.prisma` — the data model is the foundation everything else
   sits on. If you understand the tables and how they relate, the rest
   is just "code that reads/writes those tables."
2. `server/trpc.ts` — small file, and every router depends on the two
   things it exports.
3. `server/routers/jobPosting.ts` — the simplest router, a good template
   for how the others work.
4. `server/routers/application.ts` — same shape as jobPosting, but
   with the added `StatusChange` history table and a database
   transaction — a good next step once #3 makes sense.
5. `lib/queue.ts` → `server/routers/reminder.ts` → `worker/reminderWorker.ts`,
   in that order — this is the full life of one reminder, start to finish.
6. `lib/matching.ts` → `server/routers/match.ts` — the FTS/trigram
   scoring. Read the comments in `lib/matching.ts` slowly; it's the
   most Postgres-specific logic in the codebase, and the router itself
   is easy once that part makes sense.
7. `lib/otel.ts` and the comments in `reminder.ts`/`reminderWorker.ts` —
   leave this for last; it's the most conceptually dense part, and
   nothing else depends on understanding it first.
