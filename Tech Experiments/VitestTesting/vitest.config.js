// vitest.config.js
// This is the central configuration file for Vitest.
// It controls how tests are discovered, run, and reported.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ─────────────────────────────────────────────
    // ENVIRONMENT
    // "node" means tests run in a Node.js environment (default).
    // Use "jsdom" if you're testing browser/DOM code.
    // ─────────────────────────────────────────────
    environment: 'node',

    // ─────────────────────────────────────────────
    // GLOBALS
    // When true, you can use `describe`, `it`, `expect`, etc.
    // without importing them in every file.
    // When false (default), you must import them explicitly.
    // We keep it false here to show explicit imports in examples.
    // ─────────────────────────────────────────────
    globals: false,

    // ─────────────────────────────────────────────
    // INCLUDE PATTERN
    // Which files Vitest will treat as test files.
    // ─────────────────────────────────────────────
    include: ['src/**/*.test.js'],

    // ─────────────────────────────────────────────
    // COVERAGE
    // Run with: npm run coverage
    // This uses V8 (built into Node.js) for coverage instrumentation.
    // Other option: 'istanbul' (needs @vitest/coverage-istanbul)
    // ─────────────────────────────────────────────
    coverage: {
      // Which coverage provider to use
      provider: 'v8',

      // Which files to measure coverage for
      include: ['src/**/*.js'],

      // Exclude test files themselves from coverage reports
      exclude: ['src/**/*.test.js'],

      // Output formats: 'text' prints to terminal, 'html' creates a report folder
      reporter: ['text', 'html', 'lcov'],

      // Where to put the HTML coverage report
      reportsDirectory: './coverage',

      // Optional: fail the run if coverage drops below these thresholds
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 70,
      //   statements: 80,
      // },
    },

    // ─────────────────────────────────────────────
    // UI
    // The Vitest UI is a browser-based dashboard.
    // Launch with: npm run test:ui
    // No extra config needed here — just having @vitest/ui installed is enough.
    // ─────────────────────────────────────────────
  },
});
