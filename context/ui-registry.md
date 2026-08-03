# UI Registry — CareerFlow

The consistency enforcer for every component in this app. Any component built in a future session MUST match these patterns. Check here before writing any UI code.

## Baseline — Established 2026-08-03

This baseline was established during a full UI rebuild (inline styles → Tailwind v4). Design tokens are defined in `app/globals.css` via `@theme`.

### Brand palette

| Token          | Value       | Usage                                            |
| -------------- | ----------- | ------------------------------------------------ |
| brand-50       | `#f5f2ff`   | Brand-tinted surfaces                            |
| brand-100      | `#ede8ff`   | Highlight fills (hero gradient)                  |
| brand-200      | `#ddd4ff`   | Selection bg, hover borders                      |
| brand-500      | `#8c5eff`   | Primary actions, links, focus rings              |
| brand-600      | `#7a3ff6`   | Primary button hover                            |
| brand-700      | `#6b2de0`   | Primary button active                           |
| accent-500     | `#10b981`   | Positive signals (accepted, strong match)        |

**Pattern notes:**

- `brand` (violet) = action/matching feature. `accent` (emerald) = positive/confirming signals.
- Never use raw hex in components — always `brand-*` / `accent-*` / Tailwind slate/stone scale.

### Core surfaces

| Property          | Class                                |
| ----------------- | ------------------------------------ |
| Page background   | `bg-stone-50`                        |
| Card background   | `bg-white`                           |
| Card border       | `border-slate-200`                   |
| Card radius       | `rounded-xl`                         |
| Card shadow       | `shadow-sm shadow-slate-900/5`       |
| Interactive hover | `card-hover` (custom utility)        |

### Typography

| Role          | Class                                  |
| ------------- | -------------------------------------- |
| Page heading  | `text-3xl font-semibold tracking-tight text-slate-900` |
| Section title | `text-lg font-semibold text-slate-900` |
| Body          | `text-sm text-slate-600`               |
| Muted         | `text-sm text-slate-500`               |
| Font          | Geist Sans via `--font-sans` (`font-sans`) |
| Monospace     | Geist Mono via `--font-mono` (`font-mono`) |

### Spacing

| Context       | Class                  |
| ------------- | ---------------------- |
| Page padding  | `px-4 sm:px-6 lg:px-8` |
| Page max width| `max-w-7xl mx-auto`    |
| Stack gap     | `gap-4` or `gap-6`     |
| Card padding  | `p-6`                  |

### Forms

| Property        | Class                                              |
| --------------- | -------------------------------------------------- |
| Input           | `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500` |
| Label           | `mb-1 block text-sm font-medium text-slate-700`    |
| Error text      | `mt-1 text-sm text-red-600`                        |

### Buttons

| Variant     | Class                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| Primary     | `inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50` |
| Secondary   | `inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50` |
| Danger      | `inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50` |
| Ghost       | `inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900` |

### Status badges (application status)

| Status        | Class                                        |
| ------------- | -------------------------------------------- |
| saved         | `bg-slate-100 text-slate-700 ring-slate-600/20` |
| applied       | `bg-sky-50 text-sky-700 ring-sky-600/20`     |
| interviewing  | `bg-violet-50 text-violet-700 ring-violet-600/20` |
| offer         | `bg-amber-50 text-amber-700 ring-amber-600/20` |
| accepted      | `bg-emerald-50 text-emerald-700 ring-emerald-600/20` |
| rejected      | `bg-rose-50 text-rose-700 ring-rose-600/20`  |
| withdrawn     | `bg-stone-100 text-stone-600 ring-stone-500/20` |

Badge container pattern: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset`.

### Motion

| Usage     | Class                |
| --------- | -------------------- |
| Card enter| `animate-fade-in-up` |
| Subtle    | `animate-fade-in`    |

### Empty states

- Icon (lucide, 40px, `text-slate-300`) in a `mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100`
- Title: `mt-4 text-sm font-medium text-slate-900`
- Description: `mt-1 text-sm text-slate-500`
- Optional CTA button centered below
