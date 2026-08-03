<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CareerFlow — Agent Rules

## Project

A full-stack job application tracker built to learn tRPC, Prisma, Postgres
(no AI — Postgres-native FTS + trigram matching), Auth.js (JWT sessions),
Redis/BullMQ, and OpenTelemetry. It is now a portfolio piece, so production
polish applies to everything.

## Docs — read first

- `README.md` — architecture map: what each file does and why (the "codebase guide").
- `context/project-handoff.md` — the original build plan and 7-day history (historical record).
- `context/progress-tracker.md` — **current status and next steps.** Update this as work is done.
- `context/ui-registry.md` — the design system. **Any component built or changed MUST match these patterns.**

## Non-negotiables

- **No AI/LLM anywhere in the matching logic** — smart matching is
  Postgres full-text search + trigram similarity only (`lib/matching.ts`).
- **No inline styles.** Use the shared UI primitives in
  `app/components/ui/` and Tailwind classes per `context/ui-registry.md`.
  Never introduce a raw hex color into a component — use tokenized
  `brand-*` / `accent-*` / slate classes.
- **Ownership checks on every ID** — every `getById`/`update`/`delete`
  in a router must scope by `userId` (typically via `updateMany({ where: { id, userId } })` — never trust a client-supplied ID).
- **tRPC transport is plain JSON** — no superjson. A `Date` sent from
  the client arrives as a string. Use `z.coerce.date()` in input schemas,
  never `z.date()`, when the client sends a date.
- **Protected pages** follow the Server-Component-gate + Client-Component-content
  split (see `app/dashboard/page.tsx` + `DashboardContent.tsx`). The
  server gate is the actual security boundary; do not rely on
  client-side hiding.
- **Delete flows** use the confirmation modal pattern
  (`ConfirmDeleteModal` + `getDeleteImpact` to show the blast radius) —
  never a bare one-click delete.
- A sticky navbar + footer live in `app/layout.tsx` and `app/components/NavBar.tsx` — new pages render only their content (no duplicated chrome).
