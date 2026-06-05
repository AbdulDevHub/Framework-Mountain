// ─────────────────────────────────────────────────────────────────────────────
// 02-matchers/matchers-demo.test.js
//
// CONCEPT: Vitest Matchers — how to assert different types of values.
//
// A "matcher" is the method chained after expect() that defines WHAT you're
// checking. Vitest provides dozens of built-in matchers, each suited to
// a different kind of value or check.
//
// This file is a guided tour. Each group below covers a category of matchers.
// WHY THIS MATTERS: Using the right matcher gives you clearer failure messages.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  getGreeting,
  getScore,
  getPiApproximation,
  isActive,
  isDeleted,
  getColors,
  getUser,
  getNothing,
  getMissing,
  getPopulation,
} from './matchers-demo.js';

describe('Vitest matchers showcase', () => {

  // ─── STRICT EQUALITY ─────────────────────────────────────────────────────
  // toBe() uses Object.is() — equivalent to === for primitives.
  // Use it for numbers, strings, booleans, and null.
  // Do NOT use toBe() for objects or arrays (use toEqual() instead).
  // ─────────────────────────────────────────────────────────────────────────
  describe('toBe — strict equality (primitives)', () => {
    it('checks a string with toBe', () => {
      expect(getGreeting()).toBe('Hello, World!');
    });

    it('checks a number with toBe', () => {
      expect(getScore()).toBe(42);
    });

    it('checks a boolean with toBe', () => {
      expect(isActive()).toBe(true);
    });
  });

  // ─── DEEP EQUALITY ───────────────────────────────────────────────────────
  // toEqual() does a deep comparison — it checks every property recursively.
  // Use it for objects and arrays.
  // toBe({ a: 1 }) would FAIL even if both objects look the same (different refs).
  // ─────────────────────────────────────────────────────────────────────────
  describe('toEqual — deep equality (objects & arrays)', () => {
    it('checks an object with toEqual', () => {
      expect(getUser()).toEqual({ id: 1, name: 'Alice', role: 'admin' });
    });

    it('checks an array with toEqual', () => {
      expect(getColors()).toEqual(['red', 'green', 'blue']);
    });
  });

  // ─── TRUTHINESS ──────────────────────────────────────────────────────────
  // These matchers check "truthy/falsy" in the JavaScript sense.
  //   Falsy values in JS: false, 0, '', null, undefined, NaN
  //   Everything else is truthy.
  // ─────────────────────────────────────────────────────────────────────────
  describe('toBeTruthy / toBeFalsy — truthiness checks', () => {
    it('isActive() is truthy', () => {
      expect(isActive()).toBeTruthy();
    });

    it('isDeleted() is falsy', () => {
      expect(isDeleted()).toBeFalsy();
    });

    // Non-empty strings are truthy in JS
    it('a non-empty string is truthy', () => {
      expect(getGreeting()).toBeTruthy();
    });
  });

  // ─── NULL & UNDEFINED ────────────────────────────────────────────────────
  // Use these when you need to distinguish null from undefined.
  // toBeNull()      — only passes for null (not undefined)
  // toBeUndefined() — only passes for undefined (not null)
  // toBeDefined()   — passes for anything that is NOT undefined
  // ─────────────────────────────────────────────────────────────────────────
  describe('toBeNull / toBeUndefined / toBeDefined', () => {
    it('getNothing() returns null', () => {
      expect(getNothing()).toBeNull();
    });

    it('getMissing() returns undefined', () => {
      expect(getMissing()).toBeUndefined();
    });

    it('getGreeting() is defined (not undefined)', () => {
      expect(getGreeting()).toBeDefined();
    });
  });

  // ─── NUMBER COMPARISONS ──────────────────────────────────────────────────
  // Vitest has range comparisons for numbers. These are more expressive
  // than toBe() when you don't need an exact value.
  // ─────────────────────────────────────────────────────────────────────────
  describe('number comparison matchers', () => {
    it('population is greater than 1 billion', () => {
      expect(getPopulation()).toBeGreaterThan(1_000_000_000);
    });

    it('population is less than 10 billion', () => {
      expect(getPopulation()).toBeLessThan(10_000_000_000);
    });

    it('score is greater than or equal to 42', () => {
      expect(getScore()).toBeGreaterThanOrEqual(42);
    });

    it('score is less than or equal to 42', () => {
      expect(getScore()).toBeLessThanOrEqual(42);
    });

    // ─── toBeCloseTo ────────────────────────────────────────────────────────
    // Floating-point arithmetic in JS is imprecise.
    // 0.1 + 0.2 gives 0.30000000000000004, NOT 0.3!
    // toBeCloseTo(expected, precision) handles this gracefully.
    // precision = number of decimal places to check (default: 2)
    // ─────────────────────────────────────────────────────────────────────────
    it('handles floating-point imprecision with toBeCloseTo', () => {
      // toBe(0.3) would FAIL here — try it and see!
      expect(getPiApproximation()).toBeCloseTo(0.3, 5);
    });
  });

  // ─── STRING MATCHERS ─────────────────────────────────────────────────────
  // Check whether a string contains a substring or matches a pattern.
  // ─────────────────────────────────────────────────────────────────────────
  describe('string matchers', () => {
    it('toContain — checks for a substring', () => {
      expect(getGreeting()).toContain('World');
    });

    it('toMatch — checks against a regex', () => {
      expect(getGreeting()).toMatch(/^Hello/);
    });
  });

  // ─── ARRAY MATCHERS ──────────────────────────────────────────────────────
  describe('array matchers', () => {
    it('toHaveLength — checks array length', () => {
      expect(getColors()).toHaveLength(3);
    });

    it('toContain — checks if an array includes a value', () => {
      expect(getColors()).toContain('green');
    });
  });

  // ─── NEGATION ────────────────────────────────────────────────────────────
  // Add .not before any matcher to invert the assertion.
  // ─────────────────────────────────────────────────────────────────────────
  describe('.not — negating any matcher', () => {
    it('score is not 0', () => {
      expect(getScore()).not.toBe(0);
    });

    it('colors array does not contain "purple"', () => {
      expect(getColors()).not.toContain('purple');
    });

    it('getNothing() is not undefined', () => {
      // null is NOT undefined — they are different values
      expect(getNothing()).not.toBeUndefined();
    });
  });
});
