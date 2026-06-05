// ─────────────────────────────────────────────────────────────────────────────
// 09-spies/notificationService.test.js
//
// CONCEPT: Spies with vi.spyOn()
//
// A SPY is like a mock, but with an important difference:
//
//   MOCK  — Completely replaces the original function.
//            The real code NEVER runs.
//            vi.mock() / vi.fn()
//
//   SPY   — Wraps the original function and observes calls to it.
//            The real code STILL RUNS (by default).
//            You can also optionally override the implementation.
//            vi.spyOn(object, 'methodName')
//
// WHEN TO USE A SPY VS A MOCK:
//   Use a spy when you want to verify a side effect (like logging)
//   while still running the real logic.
//
//   Use a mock when you want to isolate your code from a dependency
//   entirely (databases, APIs, external services).
//
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as logger from './logger.js';
import { sendWelcomeEmail, sendOrderConfirmation } from './notificationService.js';

describe('notificationService', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // Setup: spy on logger methods before each test.
  // We use vi.spyOn() to intercept calls to logger.info, logger.warn, etc.
  //
  // By default, spies call the REAL implementation (so console.log fires too).
  // Adding .mockImplementation(() => {}) silences the output during tests
  // while still tracking calls.
  // ─────────────────────────────────────────────────────────────────────────
  let infoSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    // Spy on logger methods but suppress their console output in test output
    infoSpy  = vi.spyOn(logger, 'info').mockImplementation(() => {});
    warnSpy  = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore the original implementations after each test
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // sendWelcomeEmail()
  // ─────────────────────────────────────────────────────────────────────────
  describe('sendWelcomeEmail()', () => {

    it('returns the correct notification object', () => {
      const user = { name: 'Alice', email: 'alice@example.com' };
      const result = sendWelcomeEmail(user);

      expect(result).toEqual({
        to: 'alice@example.com',
        subject: 'Welcome!',
        body: 'Hi Alice, welcome to our platform!',
      });
    });

    // ── Verifying a spy was called ──────────────────────────────────────────
    // This is the core of spy testing: did our function use the logger?
    it('logs an info message after sending the email', () => {
      sendWelcomeEmail({ name: 'Alice', email: 'alice@example.com' });

      // The spy records every call — we can assert on it
      expect(infoSpy).toHaveBeenCalledOnce();

      // We can also check WHAT it was called with
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('alice@example.com')
      );
    });

    it('logs an error and throws when email is missing', () => {
      // Invalid input
      expect(() => sendWelcomeEmail({ name: 'Alice' })).toThrow('Invalid user');

      // The error logger should have been called
      expect(errorSpy).toHaveBeenCalledOnce();

      // The info logger should NOT have been called (email never sent)
      expect(infoSpy).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // sendOrderConfirmation()
  // ─────────────────────────────────────────────────────────────────────────
  describe('sendOrderConfirmation()', () => {

    it('logs an info message for a normal order', () => {
      sendOrderConfirmation('bob@example.com', { id: 'ORD-001', total: 99.99 });

      expect(infoSpy).toHaveBeenCalledOnce();

      // No warning should be issued for a normal-sized order
      expect(warnSpy).not.toHaveBeenCalled();
    });

    // ── Verifying conditional logging ───────────────────────────────────────
    // The service should log a warning for unusually large orders.
    // The spy lets us verify this path was taken.
    it('logs a warning for unusually large orders (over $10,000)', () => {
      sendOrderConfirmation('big@spender.com', { id: 'ORD-002', total: 15_000 });

      // Both a warning AND an info log should fire
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(infoSpy).toHaveBeenCalledOnce();

      // Verify the warning message mentions the order details
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ORD-002')
      );
    });

    it('returns the notification with the correct subject line', () => {
      const result = sendOrderConfirmation('test@example.com', { id: 'ORD-003', total: 50 });

      expect(result.subject).toBe('Order #ORD-003 Confirmed');
    });
  });
});
