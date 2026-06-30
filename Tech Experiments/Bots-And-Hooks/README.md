# Bots-And-Hooks

A practice repository for learning three essential tools that keep a codebase healthy and secure: **Husky**, **Dependabot**, and **Snyk**. Each tool operates at a different layer of the development workflow.

---

## The Big Picture

| Tool | Where it runs | What it does |
|---|---|---|
| Husky | Your machine (local) | Runs checks before every commit |
| Dependabot | GitHub (cloud) | Opens PRs when dependencies go out of date or have vulnerabilities |
| Snyk | GitHub (cloud) | Opens PRs for known security vulnerabilities, with deeper analysis than Dependabot |

---

## Tool 1: Husky

Husky lets you attach scripts to **Git hooks** — moments in the Git lifecycle like committing or pushing. The hook runs a command, and if it exits with an error (non-zero exit code), Git blocks the action entirely.

### How it works

```
git commit → Husky intercepts → runs pre-commit script → 
  ✗ script fails → commit blocked
  ✓ script passes → commit allowed
```

### Setup (from scratch)

```bash
# 1. Initialize a Node project
npm init -y

# 2. Install Husky as a dev dependency
npm install husky --save-dev

# 3. Initialize Husky (creates .husky/ folder + adds prepare script)
npx husky init
```

### Key files

**`.husky/pre-commit`** — the hook script Git runs before every commit:

```bash
npm run lint
```

**`package.json`** — the prepare script ensures Husky re-installs for anyone who clones the repo:

```json
"scripts": {
  "prepare": "husky",
  "lint": "eslint ."
}
```

### Adding ESLint (so the hook has something useful to run)

```bash
npm init @eslint/config@latest
```

Add an ignores block to `eslint.config.mjs` to skip auto-generated files:

```js
{ ignores: ["node_modules/**", "package-lock.json"] }
```

### Available hooks

You create a hook by adding a file to `.husky/` named after the hook. The file contains any shell command — if it exits with an error, Git blocks the action. Here are the most useful ones:

**`pre-commit`** — runs before a commit is finalized. Best for fast checks that give instant feedback.

```bash
npm run lint          # catch code style issues
npx prettier --check . # catch formatting issues
```

**`commit-msg`** — runs after you type a commit message, before the commit is saved. Used to enforce a message format using **gitmoji + conventional commits**: an emoji first, then the type, then the description. If the message doesn't match, the commit is blocked.

Gitmoji commit format:

```
emoji type(optional scope): description

✨ feat: add login page
🐛 fix(auth): handle expired tokens
📝 docs: fix typo in README
⬆️ chore: update dependencies
```

Both actual emoji (`✨`) and text shortcodes (`:sparkles:`) are accepted.

Setup:

```bash
# Install commitlint + the gitmoji config
npm install --save-dev @commitlint/cli @commitlint/config-conventional commitlint-config-gitmoji
```

`commitlint.config.mjs`:

```js
export default { extends: ['gitmoji'] };
```

`.husky/commit-msg` — note the shebang line is required on Windows so Git uses `sh` (via Git Bash) rather than PowerShell, which doesn't understand `$1`:

```sh
#!/usr/bin/env sh
npx --no -- commitlint --edit "${1}"
```

### Gitmoji reference

| Emoji | Shortcode | Type | Use for |
|---|---|---|---|
| ✨ | `:sparkles:` | feat | New feature |
| 🐛 | `:bug:` | fix | Bug fix |
| 📝 | `:memo:` | docs | Documentation |
| ♻️ | `:recycle:` | refactor | Refactoring code |
| 🎨 | `:art:` | style | Code formatting |
| ✅ | `:white_check_mark:` | test | Adding tests |
| ⬆️ | `:arrow_up:` | chore | Upgrading dependencies |
| ⬇️ | `:arrow_down:` | chore | Downgrading dependencies |
| 🚀 | `:rocket:` | chore | Deployments |
| 🔥 | `:fire:` | — | Removing code or files |
| 🎉 | `:tada:` | — | Initial commit |
| 🔒 | `:lock:` | — | Fixing security issues |
| 🚧 | `:construction:` | — | Work in progress |
| 💚 | `:green_heart:` | — | Fixing CI build |
| 🔧 | `:wrench:` | — | Config file changes |

Full list at [gitmoji.dev](https://gitmoji.dev).

**Variant: plain conventional commits (no emoji)**

If you prefer commits without emoji, swap the config package:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

`commitlint.config.mjs`:

```js
export default { extends: ['@commitlint/config-conventional'] };
```

The `.husky/commit-msg` file stays identical — only the config changes. Messages now follow:

```
type(optional scope): description

feat: add login page
fix(auth): handle expired tokens
chore: update dependencies
docs: fix typo in README
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`.

**`pre-push`** — runs before `git push` sends anything to the remote. Best for slower checks you don't want slowing down every commit.

```bash
npm test              # run full test suite before pushing
```

**`prepare-commit-msg`** — runs before the commit message editor opens. Can be used to auto-populate the message with a branch name or ticket number.

**`post-merge`** — runs after a `git merge` or `git pull`. Useful for automatically installing new dependencies if `package.json` changed.

```bash
npm install           # auto-install if package.json changed after a pull
```

A realistic project typically combines two or three of these: `pre-commit` for linting/formatting (fast, runs always), `commit-msg` for message format (instant), and `pre-push` for tests (slower, runs less often).

### What Husky cannot do

Husky only controls actions taken locally on your machine. It cannot:

- **Block direct pushes to `main` on GitHub** — that requires GitHub's **branch protection rules** (Settings → Branches → Add rule), which are enforced server-side regardless of what's on any developer's machine.
- **Run checks on other people's machines** unless they have also run `npm install` (which triggers the `prepare` script that sets Husky up).
- **Replace CI/CD** — a developer can bypass local hooks with `git commit --no-verify`. Server-side checks (GitHub Actions, branch protection) are the real enforcement layer; Husky is a fast local convenience on top of that.

### Key concept

The mechanism is always the same regardless of what command you put in the hook: **non-zero exit code = blocked action**. Husky is just the manager that ensures these hook files exist and are wired into Git.

---

## Tool 2: Dependabot

Dependabot is a GitHub-native feature (no separate account needed) that monitors your dependencies and automatically opens pull requests when something needs updating.

### Two modes

**Security updates** — triggered when a dependency has a known vulnerability. Dependabot opens a PR to bump it to a patched version automatically.

**Version updates** — triggered when a newer version of a dependency exists, even with no security issue. Requires a config file (see below).

### Setup

**Security updates:** Go to your GitHub repo → **Settings → Code security** → enable **Dependabot alerts** and **Dependabot security updates**.

**Version updates:** Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

- `package-ecosystem` — the dependency manager to watch (`npm`, `pip`, `docker`, `github-actions`, etc.)
- `directory` — where to find the manifest file relative to repo root
- `schedule.interval` — how often to check (`daily`, `weekly`, or `monthly`)

### How to trigger manually

GitHub repo → **Insights → Dependency graph → Dependabot** → find your config entry → click the options menu to force an immediate check rather than wait for the schedule.

### Reading a Dependabot PR

- **Compatibility score** — NOT a guarantee the update is safe for your specific code. It's an aggregate stat: "of all public repos that took this same version bump, what % had their CI pass." Your own tests are the real safety net.
- Dependabot will rebase its PRs automatically if your main branch changes.
- You can comment `@dependabot rebase` or `@dependabot merge` directly on the PR to trigger actions.

---

## Tool 3: Snyk

Snyk is a third-party security platform (free tier available at snyk.io) focused specifically on vulnerabilities. It overlaps with Dependabot's security mode but with a different scanning engine, more detailed CVE analysis, and the ability to also scan source code (not just dependencies).

### Dependabot vs Snyk security updates

| | Dependabot | Snyk |
|---|---|---|
| Scans dependencies for vulnerabilities | ✓ | ✓ |
| Opens fix PRs automatically | ✓ | ✓ |
| Scans source code for security issues | ✗ | ✓ |
| Scans containers/Docker images | ✗ | ✓ |
| Requires separate account | ✗ (GitHub native) | ✓ (snyk.io) |

Many teams run both — Dependabot for general version currency, Snyk for deeper security analysis.

### Setup

1. Sign up at [snyk.io](https://snyk.io) — use "Sign up with GitHub" for easiest integration.
2. In the Snyk dashboard, import your GitHub repository.
3. Snyk scans immediately and shows vulnerabilities in its dashboard.
4. To enable automatic fix PRs on GitHub: **Settings → Integrations → GitHub → Automatic fix PRs → Enable "New vulnerabilities" → Save**.

### What Snyk PRs look like

Snyk opens PRs from a verified bot account (`snyk-bot@snyk.io`) with PGP-signed commits, so they show as "verified" on GitHub. Snyk automatically closes its fix PRs once the vulnerability they target is resolved.

### Triggering a manual re-test

In the Snyk dashboard, open your project and click **"Retest now"**. Note: after a manual retest, Snyk won't auto-create a PR again until the next scheduled scan window (daily or weekly, depending on your settings).

---

## How the three tools work together

```
Developer writes code
        │
        ▼
  git commit
        │
   Husky runs
        │
   ESLint passes? ──✗──→ Commit blocked (fix your code)
        │ ✓
        ▼
  Commit created
        │
   git push
        │
   Code on GitHub
        │
        ├──→ Dependabot watches package.json
        │         │
        │    New version or vulnerability found?
        │         │ yes
        │         ▼
        │    PR opened on GitHub to bump the package
        │
        └──→ Snyk scans dependencies + code
                  │
             Vulnerability found?
                  │ yes
                  ▼
             PR opened on GitHub with security fix
```

Each tool is independent — Husky runs locally regardless of GitHub, and Dependabot/Snyk run on GitHub regardless of whether Husky is installed. But together they cover the full lifecycle: bad code can't be committed, and dependency issues are caught and fixed automatically in the background.

---

## Project structure

```
bots-and-hooks/
├── .github/
│   └── dependabot.yml       # Dependabot version update config
├── .husky/
│   ├── pre-commit           # Git hook: runs lint before every commit
│   └── commit-msg           # Git hook: enforces conventional commit message format
├── node_modules/
├── commitlint.config.mjs    # Commitlint rules config (gitmoji format)
├── eslint.config.mjs        # ESLint rules config
├── package.json             # Node project manifest + scripts
├── package-lock.json        # Auto-generated dependency lockfile
└── README.md
```

---

## Quick reference: common commands

```bash
# Run the linter manually (same thing Husky runs on commit)
npm run lint

# Force Husky to reinstall its hooks (if something seems broken)
npm run prepare

# Install dependencies (also triggers Husky setup via prepare script)
npm install
```
