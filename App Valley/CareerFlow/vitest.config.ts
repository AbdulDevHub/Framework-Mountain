import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Dummy-but-valid values so lib/env.ts's Zod schema passes when test
// files transitively import modules that import env.ts (lib/otel.ts,
// lib/prisma.ts, etc.) — these are never used to make a real
// connection in the mocked unit/router tests. The matching.ts suite
// (tests/integration/matching.test.ts) overrides DATABASE_URL for real
// via its own check and is skipped automatically if Postgres isn't
// reachable.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://careerflow:careerflow_dev_only@localhost:5432/careerflow",
      REDIS_URL: "redis://localhost:6379",
      AUTH_SECRET: "test-secret-not-for-real-use",
      GITHUB_CLIENT_ID: "test-client-id",
      GITHUB_CLIENT_SECRET: "test-client-secret",
      NODE_ENV: "test",
    },
  },
});
