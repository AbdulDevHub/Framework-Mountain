# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 5 — Dashboard
**Last completed:** 16 Recent Activity — Real Data
**Next:** 17 Analytics Charts — PostHog Data

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [x] 10 Adzuna Job Discovery
- [x] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [x] 12 Job Details Page — Full UI
- [x] 13 Company Research Agent

### Phase 5 — Dashboard

- [x] 14 Dashboard Page — Full UI
- [x] 15 Stats Bar — Real Data
- [x] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- Homepage built as reusable App Router components: `Navbar`, `Hero`, `HowItWorks`, `Features`, `SuccessStory`, `CTASection`, and `Footer`.
- Landing page visuals rely on shared token-driven helpers in `app/globals.css` (`landing-panel`, `landing-grid`, `landing-hero-glow`, `landing-divider`) instead of component-level hardcoded color values.
- Landing CTA styling now uses `text-[var(--color-accent-foreground)]` on dark CTAs to guarantee readable contrast on all link/button states.
- Primary homepage CTAs currently point to `/login` until auth flow is implemented in Feature 02.
- Auth uses InsForge `@insforge/sdk` v1.3.1 with the SSR helpers from `@insforge/sdk/ssr`.
- OAuth starts through local route handlers at `/api/auth/oauth/google` and `/api/auth/oauth/github`; these store the PKCE verifier in an app-owned httpOnly cookie before redirecting to the provider.
- `/callback` completes the OAuth exchange server-side, sets InsForge auth cookies with `setAuthCookies`, then redirects incomplete or missing profiles to `/profile` and complete profiles to `/dashboard`.
- Next.js 16 route protection is implemented with root `proxy.ts`, not deprecated `middleware.ts`.
- PostHog browser initialization now runs from root `instrumentation-client.ts`, backed by `lib/posthog-client.ts`, and accepts either `NEXT_PUBLIC_POSTHOG_KEY` or PostHog's setup-screen `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. `NEXT_PUBLIC_POSTHOG_HOST` defaults to US Cloud when omitted.
- PostHog server tracking is centralized in `lib/posthog-server.ts` with a typed event contract limited to the seven approved JobPilot event names.
- Authenticated placeholder pages call `posthog.identify()` through `PostHogIdentify`, and current sign-out links call `posthog.reset()` before hitting `/api/auth/logout`.
- AI integration refactored to support OpenRouter dynamically, prioritizing `OPENAI_API_KEY` (using `gpt-4o`) and falling back to `OPEN_ROUTER_API_KEY` (using `meta-llama/llama-3.3-70b-instruct:free` or the model defined by `OPEN_ROUTER_MODEL`). The initialization is centralized in `lib/openai.ts`, and updates were applied to `actions/profile.ts`, `app/api/resume/generate/route.tsx`, `app/api/agent/find/route.ts`, and `agent/research.ts` (including Stagehand configuration).

---

## Notes

- The homepage uses the provided assets from `public/logo.png` and `public/images/` to match the approved design.
- Production build verification passed after allowing `next/font` to fetch the required Inter font outside the sandbox.
- Feature 02 lint and production build verification passed. Build still requires network access for `next/font` to fetch Inter.
- Feature 03 lint and production build verification passed. The first build attempt still failed on the known sandboxed `next/font` Inter fetch; rerunning with network access passed. PostHog will stay inactive until `NEXT_PUBLIC_POSTHOG_KEY` or `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is present in `.env.local`.
- Feature 04: four tables (`profiles`, `agent_runs`, `jobs`, `agent_logs`) created via InsForge CLI migrations with full RLS (16 policies). Two Postgres triggers on `profiles`: `on_profile_updated` auto-sets `updated_at`; `on_auth_user_created` on `auth.users` auto-inserts a minimal profile row on signup. `resumes` private storage bucket created with path-scoped RLS on `storage.objects`. `types/index.ts` created with `Profile`, `WorkExperience`, `Education`, `AgentRun`, `Job`, `AgentLog` interfaces.
- Feature 06: `actions/profile.ts` created with `saveProfile` (text fields → `profiles` table, `is_complete` calculated via `calculateCompletion`, `profile_completed` PostHog event on first completion) and `uploadResume` (PDF → InsForge Storage at `{userId}/resume.pdf`, URL saved to `profiles.resume_pdf_url`). `lib/profile-utils.ts` created with shared `calculateCompletion` (9 required fields). `MissingField` union type moved to `types/index.ts`. `ProfileForm` now accepts `profile` prop, initialises all state from DB, has `<form onSubmit>` with `useTransition`, loading/error/success feedback, and `coverLetterTone` field added to Job Preferences. `ResumeSection` uploads on file selection via `uploadResume`. `ProfilePage` fetches full profile from DB and passes real data to all components. Three bugs fixed post-build: (1) `requireUser()` moved outside `try/catch` in both actions so `NEXT_REDIRECT` is never swallowed; (2) `parseInt` NaN guard added for years of experience; (3) `.select("id").maybeSingle()` added after `.update()` so zero-rows-updated is caught as an error instead of silent success. Profile row backfilled for existing user via `INSERT … ON CONFLICT DO NOTHING`. `ProfileAttentionBanner` now returns `null` at 100% completion.
- Feature 08: `@react-pdf/renderer` installed. `app/api/resume/generate/route.tsx` (POST handler: auth → profile fetch → GPT-4o content generation → `renderToBuffer` → storage remove+upload → DB update → `revalidatePath`) and `app/api/resume/generate/ResumePDF.tsx` (server-only PDF component + `GeneratedContent` type) created. `ResumeSection.tsx` wired with `handleGenerate` handler, loading/error/success state, and `window.open('/api/resume/download')` on success. Route file is `.tsx` (JSX required for `renderToBuffer`). Buffer cast to `ArrayBuffer` before `new Blob()` to satisfy strict TS.
- Feature 07: `extractProfile` Server Action added to `actions/profile.ts`. Installs `pdf-parse@1.1.1` (v1) and `openai`. Flow: download resume from InsForge Storage → `pdf-parse` extracts text → GPT-4o with `response_format: json_object`, `temperature: 0.3`, `max_tokens: 800` → `ExtractedProfile` typed return. Empty-text guard returns user-friendly error. `ProfileForm` gains `ProfileFormHandle` ref type with `applyExtracted()` method via `useImperativeHandle`. `ResumeSection` gains `onExtracted` callback prop and an `Extract Profile` button (only visible when a resume exists). Thin `ProfilePageClient` client wrapper holds the `useRef<ProfileFormHandle>` and wires `ResumeSection.onExtracted → ProfileForm.applyExtracted`. `app/profile/page.tsx` now renders `ProfilePageClient` instead of the two components separately. Critical notes: (1) Must use `pdf-parse@1.1.1` (v1), NOT v2 — v2 uses pdfjs-dist v5 with ESM-only web workers that webpack cannot bundle in Server Actions. (2) Must import from `pdf-parse/lib/pdf-parse.js`, NOT the package index — the index.js has a debug block that reads a test PDF file on every `require()` call when `module.parent` is null (always true under Next.js/Turbopack), causing an ENOENT crash on page load.
- Feature 11: `GET /api/jobs` route created — accepts `search`, `matchFilter`, `sortOption`, `page` query params; runs server-side InsForge DB query with `.ilike` text search, `.gte`/`.lt` match score filters, `.order` sort, and `.range` pagination (20 per page); returns `{ jobs, totalCount, page, pageSize }`. `FindJobsClient` refactored: removed `useMemo`, added `fetchJobs` callback (called via `useEffect` on filter/sort/page changes and after a successful search); `initialTotalCount` prop added. `JobsTable` gains optional `isLoading` prop — dims table to `opacity-60` during fetch and skips empty-state when loading. `app/find-jobs/page.tsx` updated to fetch first page with `match_score` sort and pass `count` as `initialTotalCount`.
- Feature 10: `lib/adzuna.ts` — `searchJobs` HTTP helper. `app/api/agent/find/route.ts` — POST handler: auth → profile fetch → agent_run insert → Adzuna search → single GPT-4o batch scoring call → DB insert → agent_run update. `FindJobsClient` wired to `/api/agent/find`; after search, re-fetches from DB via `fetchJobs`. `jobs.source` corrected from `"linkedin"|"url"` to `"search"|"url"`.
- Feature 09: Find Jobs page built with mock data matching the design. `lib/utils.ts` created with `MATCH_THRESHOLD = 70`, `getMatchScoreColor`, `getMatchScoreTextColor`, `formatDate`, `formatSalary`. Components: `SearchControls` (job title + location inputs, Find Jobs button, success banner), `JobFilters` (text search + All Matches/High Match/Low Match dropdown + Match Score/Newest/Oldest sort), `JobsTable` (company icon, role, match score progress bar with score-range colors, salary, source badge, date), `JobsPagination` (showing X to Y of Z, Previous/page numbers/Next). `FindJobsClient` client wrapper owns all filter/sort/pagination state with `useMemo` for derived list. Filter and sort reset page to 1 on change. `Jobs by Adzuna` credit shown when jobs exist. Mock data uses 6 jobs matching the design exactly.
- Feature 05: full profile page UI built with mock data. Components: `ProfileAttentionBanner` (SVG completion ring, missing field warning badges), `ConnectedAccounts` (LinkedIn row with Connect button), `ResumeSection` (drag-and-drop PDF upload area, Generate Resume from Profile button), `ProfileForm` (Personal Info, Professional Info with tag inputs for skills/industries, Work Experience with add/remove roles + month/year selects, Education, Job Preferences). Navbar updated to `"use client"` with `usePathname`-driven active link highlighting.
- Feature 12: `app/find-jobs/[id]/page.tsx` created as a dynamic, server-rendered job details route. It authenticates with `requireUser()`, fetches one `jobs` row scoped by both `id` and `user_id`, and renders `notFound()` when unavailable. Components added under `components/job-details/`: `JobActions`, `JobInfo`, `MatchScore`, `JobDescription`, and `CompanyResearch`. The page matches `context/designs/job-details.png`: centered detail column, Back to Jobs link, job header with placeholder company icon, match score badge, View Job Post link, four info cards, AI match reasoning card, matched/gap skill badges, description card, company research empty state, and bottom Apply Now CTA. `Navbar` now accepts `isAuthenticated` to show the signed-in app actions shown in the design; authenticated app pages opt into that state. `types/index.ts` now includes `CompanyResearchDossier` and `Job.company_research`. Verification: `npm run lint` passes with four pre-existing warnings; `npm run build` passes and includes `/find-jobs/[id]`.
- Feature 12 review follow-up: `JobDescription` now renders the full stored description with `whitespace-pre-line`, includes populated structured sections (`responsibilities`, `requirements`, `nice_to_have`, `benefits`), and detects Adzuna previews ending in `…` or `...` to show a `View Full Job Post` notice. Important caveat: Adzuna `description` is often a source-side preview, so the app cannot display text that was never returned/saved; users get a direct full-post fallback in those cases. Verification: `npm run lint && npm run build` passes with the same four pre-existing warnings.
- Feature 16: Recent Activity wired to real DB data. `RecentActivity` now accepts an `items` prop (no more hardcoded mock array); renders an empty state when no activity exists. Dashboard page fetches `agent_runs` (completed, last 10 by `completed_at`) and `jobs` where `company_research IS NOT NULL` (last 10 by `found_at`) in the existing `Promise.all`. Both sets are mapped to a shared `ActivityItem` shape with a `sortKey`, merged, sorted descending, and sliced to 10. `formatDate` from `lib/utils.ts` formats timestamps as relative strings ("X mins ago", "Yesterday", etc.). Verification: `npm run lint && npm run build` passes with same four pre-existing warnings.
- Feature 15: Stats Bar wired to real InsForge DB data. `StatsBar` now accepts four props (`totalJobs`, `avgMatchRate`, `companiesResearched`, `jobsThisWeek`) instead of hardcoded mock values. Dashboard page runs a single `jobs` query selecting `match_score`, `company_research`, and `found_at` for the current user, then derives all four stats: total count, rounded average match score, count of non-null `company_research` rows, and count of rows with `found_at` within the last 7 days. Profile and jobs queries run in parallel via `Promise.all`. Verification: `npm run lint && npm run build` passes with same four pre-existing warnings.
- Feature 14: Dashboard Page full UI built with mock data. `recharts` installed. Components: `StatsBar` (4 stat cards — Total Jobs Found, Avg. Match Rate, Companies Researched, Jobs This Week — with green trend badges), `RecentActivity` (5 activity items with colored dot indicators: green for job_found, blue for researched), `CompanyResearchChart` / `JobsOverTimeChart` / `MatchDistributionChart` (all in `components/dashboard/AnalyticsCharts.tsx` as named client-component exports using recharts BarChart/AreaChart with token-driven colors, no hardcoded hex). Dashboard page fetches profile for completion banner, renders all components in the correct layout: stats row → activity+research chart row → jobs over time + match distribution row. Verification: `npm run lint && npm run build` passes with same four pre-existing warnings.
- Feature 13: Company Research Agent complete. `agent/research.ts` implements Browserbase Fetch API redirect resolution, single-session Browserbase + Stagehand homepage/sub-page extraction, and GPT-4o candidate-specific dossier synthesis with fallback synthesis when browser research fails. `app/api/agent/research/route.ts` authenticates, validates `jobId`, loads user-scoped job/profile data, logs agent progress to `agent_logs`, saves `jobs.company_research`, revalidates `/find-jobs/{id}`, and tracks `company_researched`. `components/job-details/CompanyResearch.tsx` now renders all 9 dossier fields read-only when saved, and `ResearchCompanyButton` handles loading/error/success plus `router.refresh()` after generation. `types/index.ts` now uses the full 9-field `CompanyResearchDossier`; `lib/posthog-server.ts` accepts `company_researched`; `zod` is an explicit dependency. Verification: `npm run lint` passes with four pre-existing warnings; `npm run build` passes and includes `/api/agent/research`.
