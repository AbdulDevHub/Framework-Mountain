# CareerFlow — Progress Tracker

The "where it stands right now" document. Update this as work is done.
The 7-day build history lives in `context/project-handoff.md`; the design
system lives in `context/ui-registry.md`.

## Project status

**Phase: Portfolio polish — largely complete.** The app has full
end-to-end features (auth, CRUD, matching, reminders, tracing) and a
cohesive design system. What remains is scenario-testing, small
refinements, and deployment concerns.

## What's done

- **Design system overhaul** (Tailwind v4, `@theme` tokens in
  `app/globals.css`, shared primitives in `app/components/ui/`).
- **Dashboard** — stats strip, rich application cards, inline edit for
  postings/resumes, impact-aware delete modals (`getDeleteImpact`).
- **Application detail page** — status timeline, edit form, status
  updater, reminder scheduling, `MatchScoreCard` with history + stale
  warning.
- **Reminders page** — status filter tabs + cancel for pending; each entry
  shows the application's company/role (linked), not just a status badge.
- **Dashboard reminder activity** — "Recent reminders" section surfaces the
  5 most recent sent reminders (company/role, sent time, link to app),
  polled every 30s so the worker's separate-process delivery shows up
  without a manual reload. Delivery semantics: an in-app activity record
  (the ReminderJob row flipping to `sent` + `sentAt`) — no email/push by
  design; documented in `worker/reminderWorker.ts`.
- **Batch match page** (`/match`) — score one resume against many
  postings; posting created inline in the new-application flow.
- **Landing / login / signup / demo** — restyled with the design system.
- **Scaffolding leftovers removed** — `page.module.css`, unused SVGs,
  old inline delete buttons; sticky navbar + footer in `app/layout.tsx`.

## Known bugs & fixes

- **Fixed**: Reminder scheduling failed with
  `Expected date, received string`. Root cause: tRPC uses plain JSON
  (no superjson), so a client `Date` arrives as a string and `z.date()`
  rejected it. Fixed with `z.coerce.date()` in `server/routers/reminder.ts`.
  Rule of thumb now baked into AGENTS.md: **never `z.date()` on client-sent
  dates; use `z.coerce.date()`**.

## Remaining / next steps

- [ ] Deploy: env vars for production (Postgres, Redis, Auth secrets), a
      hosted Postgres, and a queue provider (or a long-running worker —
      BullMQ needs a persistent process).
- [x] Confirm Redis + worker round-trip in a real run (schedule → worker
      sends → status flips to `sent`).
- [ ] Scenario-test delete cascade flows end to end (posting with linked
      applications vs. standalone).
- [ ] Design-system audit: run the `web-design-guidelines` skill against
      a few key pages before calling it portfolio-ready.
- [ ] Consider adding a "similar postings" browse feature — the one
      feature that would need a GIN index (see `scripts/explain-analyze.sql`).

## Conventions to preserve

See AGENTS.md — ownership checks on every ID, no inline styles, plain-JSON
tRPC dates, Server-Component gate + Client-Component content on protected
pages, and the confirmation-modal delete pattern.
