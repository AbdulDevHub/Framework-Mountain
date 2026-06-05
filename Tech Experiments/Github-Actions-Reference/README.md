# GitHub Actions Reference Project

A minimal, well-commented project for learning GitHub Actions CI/CD. Every file
is designed to be a clear reference — read the comments to understand the *why*,
not just the *what*.

---

## What this project demonstrates

| CI Step | Tool | Config file |
|---|---|---|
| Install dependencies | npm ci | `ci.yml` → Step 3 |
| Lint | ESLint + TypeScript plugin | `.eslintrc.cjs` |
| Type-check | TypeScript (`tsc --noEmit`) | `tsconfig.json` |
| Unit tests | Vitest | `src/math.test.ts` |
| Docker image build | Docker Buildx | `Dockerfile` |

---

## Project structure

```
.
├── .github/
│   └── workflows/
│       └── ci.yml          ← The GitHub Actions workflow (start here)
├── src/
│   ├── math.ts             ← Simple TypeScript module
│   └── math.test.ts        ← Vitest tests for math.ts
├── .dockerignore            ← Files excluded from Docker build context
├── .eslintrc.cjs            ← ESLint rules
├── .gitignore
├── Dockerfile               ← Multi-stage Docker build
├── package.json             ← npm scripts and dependencies
├── tsconfig.json            ← TypeScript compiler options
└── README.md                ← You are here
```

---

## How GitHub Actions works (the short version)

```
You push code
    │
    ▼
GitHub reads .github/workflows/ci.yml
    │
    ▼
GitHub spins up a fresh Ubuntu VM (the "runner")
    │
    ▼
Each step runs in order on that VM:
  1. Checkout your code
  2. Install Node
  3. npm ci
  4. ESLint
  5. tsc --noEmit
  6. vitest run
    │
    ▼  (only if job "ci" passes)
Job "docker" runs:
  1. Checkout your code
  2. Set up Docker Buildx
  3. Build the Docker image
    │
    ▼
✅ All green → PR can be merged
❌ Any step exits non-zero → CI fails, merge is blocked
```

---

## Running locally

```bash
# Install dependencies
npm ci

# Lint
npm run lint

# Type-check (no output = no errors)
npm run typecheck

# Run tests
npm test

# Build Docker image
docker build -t github-actions-reference .
```

---

## Key concepts to remember

### Triggers (`on:`)
Controls *when* the workflow runs. Common triggers:
- `push` — every commit pushed to GitHub
- `pull_request` — when a PR is opened or updated
- `schedule` — cron-style (e.g. nightly builds)
- `workflow_dispatch` — manual trigger from the GitHub UI

### Jobs
A workflow can have many jobs. By default they run **in parallel**. Use
`needs: <job-name>` to make one job wait for another.

### Steps
Each step is either:
- `uses: owner/action@version` — a pre-built Action from the Marketplace
- `run: some shell command` — a raw shell command

### Exit codes
If **any** step exits with a non-zero code, that step **fails**, the job
stops, and the workflow is marked failed. This is how CI enforces quality:
ESLint, tsc, and Vitest all exit non-zero when they find problems.

### Caching
`actions/setup-node` with `cache: "npm"` caches your `~/.npm` folder between
runs. This can cut install time from ~30s to ~3s on repeat pushes.

### Multi-stage Docker builds
Stage 1 (builder): install everything, compile.  
Stage 2 (runtime): start fresh, copy only what's needed to run.  
Result: a small, production-ready image with no dev tooling inside it.

---

## Extending this project

Some natural next steps as you keep learning:

- **Add a deploy job** — push the Docker image to GitHub Container Registry
  (`ghcr.io`) after a successful build on `main`.
- **Add branch protection** — in GitHub repo Settings → Branches, require the
  `CI` workflow to pass before merging to `main`.
- **Add coverage reporting** — Vitest can emit coverage reports;
  `codecov/codecov-action` can upload them.
- **Matrix builds** — test against multiple Node versions simultaneously using
  `strategy.matrix`.
