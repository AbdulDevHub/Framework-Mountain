// ─────────────────────────────────────────────────────────────────────────────
// 04-each/validators.test.js
//
// CONCEPT: it.each — running the same test logic with many different inputs.
//
// Without it.each, you'd write one test per input/output pair:
//   it('isEven(2) is true',  () => expect(isEven(2)).toBe(true));
//   it('isEven(3) is false', () => expect(isEven(3)).toBe(false));
//   it('isEven(4) is true',  () => expect(isEven(4)).toBe(true));
//   ... and so on — lots of copy-paste!
//
// it.each() solves this by letting you define a table of test cases and
// running the same test function once per row.
//
// WHEN TO USE it.each:
//   ✅ Pure functions with predictable input → output
//   ✅ Boundary values / edge cases you want to exhaustively test
//   ✅ Anywhere you'd otherwise copy-paste the same test multiple times
//   ❌ Complex setups where each case needs unique preparation
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { isEven, isPositive, capitalize, clamp } from './validators.js';

describe('Validators with it.each', () => {

  // ─── ARRAY SYNTAX ────────────────────────────────────────────────────────
  // The simplest form: it.each(arrayOfArrays)
  // Each inner array = one test case.
  // In the test name, %i = first arg, %i = second arg (or use %s for strings).
  //   %s — string
  //   %i — integer
  //   %f — float
  //   %o — object
  //   %# — test index
  // ─────────────────────────────────────────────────────────────────────────
  describe('isEven() — array syntax', () => {

    it.each([
      // [input, expectedResult]
      [0,  true],
      [2,  true],
      [4,  true],
      [100, true],
      [1,  false],
      [3,  false],
      [-1, false],
      [-2, true],  // negative even numbers are still even
    ])('isEven(%i) returns %s', (input, expected) => {
      expect(isEven(input)).toBe(expected);
    });
  });

  // ─── OBJECT TABLE SYNTAX ─────────────────────────────────────────────────
  // A more readable alternative: pass an array of objects.
  // Use ${propertyName} placeholders in the test name string.
  // This is great when each case has many fields and array indexes get confusing.
  // ─────────────────────────────────────────────────────────────────────────
  describe('isPositive() — object table syntax', () => {

    it.each([
      { input: 1,    expected: true,  description: 'a small positive number' },
      { input: 100,  expected: true,  description: 'a large positive number' },
      { input: 0.1,  expected: true,  description: 'a positive decimal' },
      { input: 0,    expected: false, description: 'zero (not considered positive)' },
      { input: -1,   expected: false, description: 'a negative number' },
      { input: -100, expected: false, description: 'a large negative number' },
    ])('isPositive($input) returns $expected — $description', ({ input, expected }) => {
      expect(isPositive(input)).toBe(expected);
    });
  });

  // ─── STRING TRANSFORMATION ───────────────────────────────────────────────
  // it.each works great for testing string transformations too.
  // ─────────────────────────────────────────────────────────────────────────
  describe('capitalize() — mixed syntax', () => {

    it.each([
      // [input, expected]
      ['hello',     'Hello'],
      ['WORLD',     'World'],   // lowercases the rest
      ['javaScript', 'Javascript'],
      ['a',         'A'],       // single character
      ['',          ''],        // empty string → empty string
    ])('capitalize("%s") returns "%s"', (input, expected) => {
      expect(capitalize(input)).toBe(expected);
    });
  });

  // ─── MULTIPLE ARGUMENTS ──────────────────────────────────────────────────
  // it.each handles functions with multiple parameters just as easily.
  // ─────────────────────────────────────────────────────────────────────────
  describe('clamp() — three-argument function', () => {

    it.each([
      { value: 5,   min: 1, max: 10, expected: 5,  label: 'within range' },
      { value: 0,   min: 1, max: 10, expected: 1,  label: 'below min' },
      { value: 15,  min: 1, max: 10, expected: 10, label: 'above max' },
      { value: 1,   min: 1, max: 10, expected: 1,  label: 'exactly at min' },
      { value: 10,  min: 1, max: 10, expected: 10, label: 'exactly at max' },
    ])('clamp($value, $min, $max) → $expected ($label)', ({ value, min, max, expected }) => {
      expect(clamp(value, min, max)).toBe(expected);
    });
  });
});
