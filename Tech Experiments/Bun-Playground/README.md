# Bun Playground

A hands-on learning project exploring [Bun](https://bun.sh) — a fast all-in-one
JavaScript/TypeScript runtime, package manager, bundler, and test runner.
Created while coming from an npm / yarn / pnpm background.

## Setup

Installed Bun on Windows via PowerShell:

```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

Verified installation:

```powershell
bun --version
```

Scaffolded this project:

```powershell
bun init
```

## What Bun replaces

| Role | Old world | Bun |
|---|---|---|
| JS/TS runtime | Node.js | `bun` |
| Package manager | npm / yarn / pnpm | `bun install` / `bun add` |
| Bundler | webpack / esbuild | `bun build` |
| Test runner | Jest / Vitest | `bun test` |
| Script runner | npm scripts | `bun run` |

Bun is written in Zig and uses JavaScriptCore (Safari's engine) instead of
Node's V8, which contributes to faster startup and execution.

## Key things explored

### 1. Running TypeScript directly — no build step

```powershell
bun index.ts
```

No `ts-node`, no compile step, no extra config needed to run `.ts` files.

### 2. Installing packages

```powershell
bun add dayjs
```

| Command | npm equivalent |
|---|---|
| `bun add <pkg>` | `npm install <pkg>` |
| `bun add -d <pkg>` | `npm install --save-dev <pkg>` |
| `bun remove <pkg>` | `npm uninstall <pkg>` |
| `bun add -g <pkg>` | `npm install -g <pkg>` |

Bun generates its own lockfile, `bun.lock`, equivalent to `package-lock.json`
/ `yarn.lock` / `pnpm-lock.yaml`.

### 3. Top-level `await` and built-in APIs

Bun supports top-level `await` with zero configuration (no `"type": "module"`
juggling required like in Node). It also ships built-ins that used to need
extra packages in Node:

```typescript
const response = await fetch("https://api.github.com/repos/oven-sh/bun");
const data = await response.json();

await Bun.write("stars.json", JSON.stringify({ stars: data.stargazers_count }, null, 2));
```

| Feature | Node | Bun |
|---|---|---|
| `fetch` | Needed `node-fetch` (pre-v18) | Built in |
| Top-level `await` | Needs `"type": "module"` | Just works |
| Fast file write | `fs.writeFile` | `Bun.write()` (built-in) |

### 4. Built-in test runner (Jest-compatible)

No install, no config. Files ending in `.test.ts` are auto-detected.

```typescript
import { expect, test, describe } from "bun:test";
import { add, isEven } from "./math";

describe("add", () => {
  test("adds two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

```powershell
bun test
```

The `bun:test` API mirrors Jest (`describe`, `test`, `expect().toBe()`, etc.),
so most Jest matchers carry over directly.

### 5. `package.json` scripts

Works the same as npm, with a shortcut:

```json
"scripts": {
  "start": "bun index.ts",
  "test": "bun test"
}
```

```powershell
bun run start   # standard
bun start       # shortcut — works as long as the script name
                 # doesn't collide with a built-in Bun command
```

**Gotcha:** a script named e.g. `test` or `install` will be shadowed by
Bun's own built-in command of the same name. `bun run test` would still hit
your script; bare `bun test` would not.

### 6. `bunx` — run CLIs without installing

Equivalent to `npx`:

```powershell
bunx cowsay "hello"
bunx create-next-app my-app
```

## Using Bun with existing frameworks

Bun has two identities:

1. **Package manager / runtime** — drop-in replacement for npm + node
2. **Bundler / test runner** — its own thing, like Vite/webpack

For frameworks that already have their own bundler (Vite, Next.js, Remix),
Bun is typically only used as identity #1 — installs and script execution —
while the framework keeps its own dev server and bundler.

**Vite:**

```powershell
bun create vite my-app
cd my-app
bun install
bun run dev
```

**Next.js:**

```powershell
bunx create-next-app my-next-app
cd my-next-app
bun run dev
```

> Note: Next.js uses its own bundler (Webpack/Turbopack). Bun speeds up
> installs and the dev server process, but doesn't replace Next's bundler.
> Some Node-specific internals in Next.js can occasionally cause edge-case
> compatibility issues — generally fine, but less battle-tested than plain
> Node for Next.js specifically.

**Rule of thumb:**

| Framework already has... | Bun's role |
|---|---|
| Own bundler/dev server (Vite, Next.js, Remix) | Package manager + runtime only |
| No bundler, just plain scripts | Can also use `bun build` and `bun test` |

`bun install` works on any existing `package.json`-based project, even ones
never touched by Bun before — usually the lowest-friction way to try it on
a real project.

## Project structure

```
bun-playground/
├── index.ts          # fetch + Bun.write demo
├── math.ts            # functions under test
├── math.test.ts        # bun:test example
├── stars.json          # output of index.ts
├── package.json
├── bun.lock
├── tsconfig.json
└── README.md
```

## Useful commands cheat sheet

```powershell
bun init                 # scaffold a new project
bun <file>.ts             # run a TS/JS file directly
bun add <pkg>              # install a dependency
bun add -d <pkg>            # install a dev dependency
bun remove <pkg>             # remove a dependency
bun run <script>               # run a package.json script
bun test                        # run tests
bunx <cli-tool>                  # run a CLI without installing
bun build <entry> --outdir dist   # bundle for production
```
