import { z } from "zod";

// ─────────────────────────────────────────────
// Why this file exists
// ─────────────────────────────────────────────
// Without this, a missing env var (e.g. you forgot to set
// GITHUB_CLIENT_ID) doesn't fail until someone actually clicks "Sign in
// with GitHub" — at which point Auth.js throws some internal error
// that's hard to connect back to "oh, I forgot to set up .env." This
// module runs ONCE, as early as possible (imported from
// instrumentation.ts for the web server, and from otel-worker-init.ts
// for the worker), reads every env var the app needs, and throws
// immediately with a clear message if anything is missing or malformed
// — before either process does anything else.

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required — generate one with: openssl rand -base64 32"),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  // Optional: the demo router (flow 10) is a nice-to-have public route,
  // not core app functionality — the whole app shouldn't refuse to
  // boot just because you haven't seeded a demo user yet. demo.ts
  // checks for this itself and throws a clear error if it's missing
  // AND someone actually hits the demo route.
  DEMO_USER_ID: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Flatten Zod's error tree into one readable list rather than
    // dumping the raw ZodError — this is the message a future you (or
    // a teammate) sees the first time they clone the repo and forget
    // to copy .env.example to .env.
    const problems = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(
      `Invalid or missing environment variables:\n${problems}\n\nDid you copy .env.example to .env and fill it in?`,
    );
  }

  return parsed.data;
}

// Computed once, at import time, and reused — this is the ONE call to
// loadEnv() in the whole codebase. Every other file imports `env` from
// here rather than reading `process.env` directly, so TypeScript knows
// these values are guaranteed to exist (no `string | undefined`
// scattered through the codebase).
export const env = loadEnv();
