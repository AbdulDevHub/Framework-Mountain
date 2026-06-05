// ─────────────────────────────────────────────────────────────────────────────
// 10-setup-teardown/counter.test.js
//
// CONCEPT: Setup and Teardown Hooks
//
// When a module has STATE (variables that persist between calls), tests can
// accidentally affect each other. If test A increments a counter and test B
// checks the initial value, B will fail — not because the code is wrong,
// but because A left dirty state behind.
//
// Vitest provides four lifecycle hooks to manage this:
//
//   beforeAll(fn)  — Runs ONCE before all tests in a describe block.
//                    Use for expensive one-time setup (DB connection, server start).
//
//   afterAll(fn)   — Runs ONCE after all tests in a describe block.
//                    Use for cleanup (close DB connection, stop server).
//
//   beforeEach(fn) — Runs before EVERY individual test.
//                    Use to reset state so each test starts fresh.
//
//   afterEach(fn)  — Runs after EVERY individual test.
//                    Use to clean up anything the test created.
//
// RULE OF THUMB:
//   Prefer beforeEach over beforeAll.
//   Independent tests are easier to debug and can run in any order.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { getCount, increment, decrement, reset, getHistory } from './counter.js';

describe('Counter module — lifecycle hooks', () => {

  // ─── beforeAll ─────────────────────────────────────────────────────────────
  // Runs ONCE before any test in this describe block starts.
  // Here we just log a message to show when it fires.
  // In a real scenario: connect to a database, start a mock server, etc.
  // ─────────────────────────────────────────────────────────────────────────
  beforeAll(() => {
    // This runs once. Think: "before any test in this suite starts"
    console.log('  [beforeAll] Suite starting — counter module is loaded');
  });

  // ─── afterAll ──────────────────────────────────────────────────────────────
  // Runs ONCE after all tests in this block have finished.
  // Use it to tear down anything set up in beforeAll.
  // ─────────────────────────────────────────────────────────────────────────
  afterAll(() => {
    // This runs once at the very end. Think: "after all tests are done"
    console.log('  [afterAll]  Suite complete — counter module tests finished');
    reset(); // Final cleanup
  });

  // ─── beforeEach ────────────────────────────────────────────────────────────
  // Runs before EVERY individual `it` block.
  // This is how we ensure each test starts with a clean slate.
  // Without this, tests would inherit the state left by previous tests.
  // ─────────────────────────────────────────────────────────────────────────
  beforeEach(() => {
    // Reset the counter to 0 before each test — ensures isolation
    reset();
  });

  // ─── afterEach ─────────────────────────────────────────────────────────────
  // Runs after EVERY individual `it` block.
  // Less commonly needed than beforeEach, but useful for:
  //   - Logging test results
  //   - Cleaning up files or network calls made during the test
  // ─────────────────────────────────────────────────────────────────────────
  afterEach(() => {
    // In this case, afterEach is redundant with our beforeEach reset,
    // but it's here to demonstrate the hook.
    // In a real test: restore mocks, delete temp files, etc.
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TESTS
  // Each test is fully isolated because beforeEach resets the counter.
  // ─────────────────────────────────────────────────────────────────────────

  it('starts at 0 after reset', () => {
    // No need to call reset() here — beforeEach does it for us
    expect(getCount()).toBe(0);
  });

  it('increments by 1 by default', () => {
    increment();
    expect(getCount()).toBe(1);
  });

  it('increments by a custom amount', () => {
    increment(5);
    expect(getCount()).toBe(5);
  });

  it('decrements by 1 by default', () => {
    increment(3); // start at 3
    decrement();  // now at 2
    expect(getCount()).toBe(2);
  });

  it('decrements by a custom amount', () => {
    increment(10);
    decrement(4);
    expect(getCount()).toBe(6);
  });

  // ── Demonstrating why isolation matters ──────────────────────────────────
  // These two tests seem trivial, but without beforeEach resetting the counter,
  // the second test would fail because the first left count at 1.
  it('count is 1 after one increment (test A)', () => {
    increment();
    expect(getCount()).toBe(1);
    // Without beforeEach: test B would inherit count = 1 from here
  });

  it('count is 1 after one increment (test B — same starting point)', () => {
    // Because of beforeEach, this test also starts at 0 — they are independent
    increment();
    expect(getCount()).toBe(1);
  });

  // ─── NESTED DESCRIBE WITH ITS OWN HOOKS ──────────────────────────────────
  // Hooks can be scoped to a nested describe block.
  // The inner hooks run IN ADDITION TO the outer hooks.
  // Order: outer beforeEach → inner beforeEach → test → inner afterEach → outer afterEach
  // ─────────────────────────────────────────────────────────────────────────
  describe('history tracking', () => {

    beforeEach(() => {
      // Run some operations to create history (outer beforeEach already reset)
      increment(3);
      decrement(1);
    });

    it('records increment actions in history', () => {
      const history = getHistory();
      expect(history[0]).toEqual({ action: 'increment', amount: 3, result: 3 });
    });

    it('records decrement actions in history', () => {
      const history = getHistory();
      expect(history[1]).toEqual({ action: 'decrement', amount: 1, result: 2 });
    });

    it('history has the correct length after two operations', () => {
      expect(getHistory()).toHaveLength(2);
    });
  });
});
