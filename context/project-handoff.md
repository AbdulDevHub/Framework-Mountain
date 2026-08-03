# Capstone Project Handoff: Job Application Tracker (No AI API)

> **Status note (2026-08-03):** This document is now a **historical
> record** of the original 7-day build plan. The project has moved past
> the learning phase into portfolio polish. For the **current status,
> known bugs, and next steps**, read `context/progress-tracker.md`
> instead. For the design system, read `context/ui-registry.md`.

*Paste this document into a fresh Claude chat, along with the attached
code files (`schema.prisma`, `trpc.ts`, and the six router files) to pick
up development. This doc + the code files together contain full context —
no prior conversation needed.*

## Context for Claude

I'm a learner working through DSA + full-stack fundamentals, using this
capstone to prove I can wire tRPC, Prisma, Auth.js, Redis/BullMQ, and
Postgres together end to end. I'm relatively new to this stack, so
**teach as you go** — explain the "why" behind decisions, not just the
"what." Act as a hands-on build partner: help me design, implement,
debug, and review incrementally. For Day 3 specifically, I've asked
Claude to write the code directly while I review and ask questions when
stuck (this differs from Day 2's more "let me write it" pacing — Day 3
should default to Claude writing code, checking in on real decisions).

**Hard constraint: no AI/LLM involved anywhere in this project.** Smart
matching is Postgres-native full-text search + trigram similarity only.

**Current status: Day 1 and Day 2 are complete.** Day 3 (Auth.js wiring +
base CRUD) is next. Start by confirming you've got the context from this
doc and the attached files, then begin Day 3.

## Project Pitch

A job application tracker that:

- Tracks job applications (status, dates, notes) per authenticated user
- Matches resume text against job postings using Postgres-native
  full-text search and fuzzy trigram similarity (no LLM)
- Queues background jobs (reminders) via BullMQ
- Is instrumented with OpenTelemetry so the queue and API can be traced
  end to end
- Includes a public, unauthenticated, read-only demo route (seeded data)
  alongside a fully functional real Auth.js login

## Tech Stack

- **API layer:** tRPC
- **ORM / DB:** Prisma + Postgres (`tsvector`/`tsquery` for full-text
  search, `pg_trgm` for fuzzy similarity)
- **Auth:** Auth.js — **JWT sessions** (not database sessions), enforced
  via tRPC context. Supports **OAuth + email/password credentials** (no
  magic-link).
- **Queue:** Redis + BullMQ
- **Observability:** OpenTelemetry, traced end to end through queued jobs
- **Frontend:** Next.js App Router, tRPC + React Query client, Server
  Components where appropriate

## Core Entities — Finalized in Day 2 (see attached `schema.prisma`)

The schema evolved from the original one-pager during Day 2 design
review. Key decisions and *why*, especially anywhere this diverges from
earlier docs:

- **`User`/`Account`** — Auth.js Prisma adapter shape. No `Session` model
  (JWT strategy doesn't need one). `User.hashedPassword` added
  (nullable) for credentials auth alongside OAuth.

- **`JobPosting`** — per-user, editable. `@@index([userId])` since almost
  every query filters by user.

- **`Resume`** — **multiple resumes per user** (variants, e.g.
  "backend-focused" vs "full-stack"), distinguished by a `label` field.
  This was a real decision, not in the original one-pager, and it's why
  `Application` has a `resumeId` (not just `jobPostingId`).

- **`Application`** — `jobPostingId` and `resumeId` are both optional
  foreign keys. Has its own `company`/`role` fields (not just derived
  from a linked posting), since a posting link is optional.
  - **Deletion behavior is asymmetric and intentional:** deleting a
    `JobPosting` **cascades** and deletes dependent `Application` rows.
    Deleting a `Resume` does **not** delete the `Application` — it just
    `SetNull`s the `resumeId` link, so application history survives.
  - **Status is tracked via a separate `StatusChange` history table**,
    not just a single `status` field with overwritten dates. This
    supports messy real-world timelines (e.g. multiple interview
    rounds, re-applying) rather than assuming each status happens once.
    `ApplicationStatus` enum: `saved, applied, interviewing, offer,
    rejected, withdrawn, accepted`.

- **`MatchResult`** — **history table**, not a single cached/upserted
  row per (resume, posting) pair — every computation is a new row, so
  score-over-time can be shown.
  - Stores **two separate scores**, `ftsScore` and `trigramScore`,
    rather than one blended number — deliberate, for
    transparency/showcase value. Note for Day 5: these are on different
    native scales (`pg_trgm`'s `similarity()` is 0–1;
    `ts_rank()` is unbounded) — don't naively average them if you ever
    want a combined number.
  - **Staleness snapshot is two-sided**: stores both
    `resumeUpdatedAtSnapshot` AND `jobPostingUpdatedAtSnapshot` (the
    original one-pager only mentioned resume staleness — this was
    corrected during Day 2 review, since postings are also editable).
  - Cascades on delete from **both** `Resume` and `JobPosting` (a match
    tied to a deleted resume/posting is meaningless and should go with
    it).

- **`ReminderJob`** — durable Prisma model, synced with BullMQ via
  `bullJobId` (nullable, unique). `ReminderStatus` enum includes
  **`cancelled`** (added beyond the original one-pager's
  pending/sent/failed) — for when a linked application's status (e.g.
  `rejected`) makes a pending reminder moot.

## tRPC Router Structure — Sketched in Day 2 (see attached router files)

Structure only — procedure names, Zod input shapes, public/protected
split. **Implementation logic (the `TODO` comments) is Day 3's job.**

- **`server/trpc.ts`** — context + `publicProcedure`/`protectedProcedure`
  builders. Auth check happens once here; **does not auto-scope data** —
  every query/mutation still needs explicit `where: { userId }`
  filtering, and every `getById`/`update`/`delete` needs to verify
  ownership of the ID passed in (never trust a client-supplied ID
  belongs to the requester).

- **`jobPosting` router** — standard CRUD (`create`, `list`, `getById`,
  `update`, `delete`), all `protectedProcedure`.

- **`resume` router** — same CRUD shape. Important: `update` must
  **not** touch existing `MatchResult` rows — staleness is meant to
  surface at read time via snapshot comparison, not trigger
  auto-recompute on edit.

- **`application` router** — CRUD, but **`update` and `updateStatus` are
  separate mutations** (deliberate split, decided in Day 2): `update`
  handles general fields (notes, company, role, links), `updateStatus`
  is dedicated and must, in one transaction, both update
  `Application.status` and insert a `StatusChange` row. Flagged for Day
  4: `updateStatus` is also where pending-reminder cancellation on
  rejection/withdrawal will eventually be triggered from.

- **`match` router** — `compute` (single, flow 6), `computeBatch`
  (multiple postings, flow 11, capped at 50 per call since it's
  synchronous by design), `getLatest` (staleness-aware read),
  `getHistory` (full computation history for a pair). Ownership checks
  must cover **both** `resumeId` and `jobPostingId` — checking only one
  is a data-leak bug.

- **`reminder` router** — `schedule` (flow 8: create the `ReminderJob`
  row **before** enqueueing the BullMQ job, not after — crash-safety
  ordering), `list` (flow 9), `cancel` (must update both the Postgres
  row **and** the actual BullMQ job — two systems that must stay in
  sync, or a "cancelled" reminder still fires).

- **`demo` router** — flow 10, entirely `publicProcedure`, hardcoded to
  a seeded `DEMO_USER_ID`, **read-only by design** (no mutations should
  ever be added to this router).

- **`server/routers/_app.ts`** — composes all six routers; exports
  `AppRouter` type for end-to-end frontend type inference on Day 6.

## User Flows → Stack Mapping (unchanged from one-pager, for reference)

| # | Flow | tRPC | Prisma/PG | Auth | Redis/BullMQ | OTel |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sign up / log in | — | ✓ (User) | ✓ | — | — |
| 2 | Add a job posting | ✓ | ✓ | ✓ | — | — |
| 3 | Log an application (posting optional) | ✓ | ✓ | ✓ | — | — |
| 4 | Update application status | ✓ | ✓ | ✓ | — | — |
| 5 | Upload/edit resume text | ✓ | ✓ | ✓ | — | — |
| 6 | Compute match score (one resume ↔ one posting) | ✓ | ✓ (FTS/trgm) | ✓ | — | — |
| 7 | Compare scores across applications on same posting | ✓ | ✓ (read) | ✓ | — | — |
| 8 | Queue + receive application follow-up reminder | ✓ | ✓ (ReminderJob) | ✓ | ✓ | ✓ |
| 9 | View upcoming/past reminders | ✓ | ✓ (read) | ✓ | — | — |
| 10 | Public read-only demo view (seeded user, no login) | ✓ (public) | ✓ (read-only) | — | — | — |
| 11 | Re-run match scores for multiple selected postings after resume edit | ✓ | ✓ (FTS/trgm, batch) | ✓ | — | — |

## 7-Day Build Plan — Status

**Day 1 — ✅ DONE.** One-pager: entities, relationships, 11 flows,
stack-per-flow mapping.

**Day 2 — ✅ DONE.** Prisma schema (all 6 entities, validated by hand
relation-by-relation) and tRPC router structure (6 routers, 30
procedures, structure + Zod shapes only) — see attached code files.

**Day 3 — Auth and base CRUD — ✅ Done**
Wire up Auth.js (JWT strategy, OAuth + credentials providers) and
implement the CRUD logic behind the `TODO` comments in `jobPosting`,
`resume`, and `application` routers, enforcing auth via context. This
includes:

- Setting up the actual Auth.js config (providers, JWT callbacks)
- Prisma client singleton setup
- Implementing `jobPosting` and `resume` CRUD (straightforward)
- Implementing `application` CRUD, including the `create` +
  initial-`StatusChange` transaction, and the `updateStatus` +
  `StatusChange` transaction
- Ownership verification on every `getById`/`update`/`delete`

**Day 4 — Background jobs with BullMQ, instrumented — ✅ Done**
Implement the reminder flow (flow 8), including the "create row before
enqueue" ordering and the cancel-on-rejection hook flagged in Day 2.
Instrument with OpenTelemetry end to end.

**Day 5 — Smart matching without AI — ✅ Done**
Implement `match` router logic: `tsvector`/`tsquery` + `pg_trgm` queries,
inserting `MatchResult` history rows with two-sided staleness snapshots
and separate FTS/trigram scores. Run `EXPLAIN ANALYZE` to confirm index
usage. References: `postgresql.org/docs/textsearch`,
`postgresql.org/docs/pg_trgm`.

**Day 6 — Rebuild the frontend shell with current patterns — ✅ Done**
Scaffold the UI in the App Router, wire up the tRPC React Query client
(using the `AppRouter` type), build the public demo route. Reference:
`nextjs.org/docs/app`.

**Day 7 — Polish one core flow end to end — ✅ Done**
Take a single flow (e.g. adding an application and seeing the match
score) and polish it fully: loading states, error handling, basic
styling, staleness warning UI for `MatchResult`. Also implement the
delete-preview/confirmation pattern flagged in Day 2 for
`jobPosting.delete` and `resume.delete`.

## Definition of Done (for the week)

- Auth-gated CRUD for applications works end to end
- At least one BullMQ job (reminder) is queued, processed, and traced via
  OpenTelemetry
- Smart matching (single + batch) returns real scores using Postgres
  FTS/trigram, backed by proper indexes, with `EXPLAIN ANALYZE` output on
  hand
- Public read-only demo route works with zero login, alongside a fully
  functional real login
- One full user flow (App Router → tRPC → Prisma → Postgres) is polished
  enough to demo

## How to help me

Confirm you've got the context from this doc and the attached code
files, confirm I'm on Day 3, then start writing the Auth.js config and
CRUD implementations directly (per the Day 3 pacing note above) — I'll
review, ask questions, and flag anything that doesn't match what I
intended.
