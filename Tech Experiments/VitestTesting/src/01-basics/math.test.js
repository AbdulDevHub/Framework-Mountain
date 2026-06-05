// ─────────────────────────────────────────────────────────────────────────────
// 01-basics/math.test.js
//
// CONCEPT: The anatomy of a Vitest test file.
//
// Every test file is made of three building blocks:
//
//   describe()  — Groups related tests together under a label.
//                 Think of it as a folder for tests.
//
//   it() / test() — Defines a single test case. `it` and `test` are identical;
//                   `it` reads more like English ("it should add two numbers").
//
//   expect()    — Makes an assertion. You pass the actual value to expect(),
//                 then chain a matcher like .toBe() to state what you expect.
//
// WHY THIS MATTERS:
//   A well-structured test file is its own form of documentation.
//   When a test fails, you know exactly WHAT broke and WHERE.
// ─────────────────────────────────────────────────────────────────────────────

// Import the functions we want to test
import { describe, it, test, expect } from 'vitest';
import { add, subtract, multiply, divide } from './math.js';

// ─── describe() ──────────────────────────────────────────────────────────────
// A describe block groups tests for a single module or concept.
// You can nest describe blocks for finer grouping (see 03-better-tests).
// ─────────────────────────────────────────────────────────────────────────────
describe('math utilities', () => {

  // ─── add ───────────────────────────────────────────────────────────────────
  describe('add()', () => {

    // it() defines one test case.
    // The string should read like a sentence: "it should add two positive numbers"
    it('should add two positive numbers', () => {
      // expect(actual).toBe(expected)
      // toBe uses strict equality (===) — good for primitives like numbers
      expect(add(2, 3)).toBe(5);
    });

    it('should add a positive and a negative number', () => {
      expect(add(10, -3)).toBe(7);
    });

    it('should return 0 when adding two zeros', () => {
      expect(add(0, 0)).toBe(0);
    });

    // test() is an alias for it() — they are 100% interchangeable
    test('should handle decimal numbers', () => {
      expect(add(1.5, 2.5)).toBe(4);
    });
  });

  // ─── subtract ──────────────────────────────────────────────────────────────
  describe('subtract()', () => {

    it('should subtract b from a', () => {
      expect(subtract(10, 4)).toBe(6);
    });

    it('should return a negative number when b > a', () => {
      expect(subtract(3, 10)).toBe(-7);
    });

    it('should return 0 when a equals b', () => {
      expect(subtract(5, 5)).toBe(0);
    });
  });

  // ─── multiply ──────────────────────────────────────────────────────────────
  describe('multiply()', () => {

    it('should multiply two positive numbers', () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it('should return 0 when multiplying by zero', () => {
      expect(multiply(99, 0)).toBe(0);
    });

    it('should return a positive number when multiplying two negatives', () => {
      expect(multiply(-3, -4)).toBe(12);
    });
  });

  // ─── divide ────────────────────────────────────────────────────────────────
  describe('divide()', () => {

    it('should divide a by b', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should return a decimal result', () => {
      expect(divide(7, 2)).toBe(3.5);
    });

    // Testing that a function THROWS an error is just as important as testing
    // the happy path. Use expect(() => fn()).toThrow() for this.
    it('should throw an error when dividing by zero', () => {
      // We must wrap the call in an arrow function so Vitest can catch the throw
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
    });

    it('should throw when dividing zero by zero', () => {
      expect(() => divide(0, 0)).toThrow();
    });
  });
});
