/**
 * src/math.test.ts
 *
 * Tests for math.ts using Vitest.
 *
 * Vitest uses the same API as Jest (describe / it / expect), so if you've
 * seen Jest before, this will look familiar.
 *
 * How tests get run:
 *   - Locally:  `npm test`
 *   - In CI:    the "Run tests (Vitest)" step in ci.yml calls `npm test`
 */

import { describe, it, expect } from "vitest";
import { add, subtract, isEven } from "./math.js";

// "describe" groups related tests under a label.
// This is optional but keeps output tidy when you have many tests.
describe("add()", () => {
  it("returns the sum of two positive numbers", () => {
    // "expect(value).toBe(expected)" is the most basic assertion.
    // If the value doesn't equal expected, the test fails and CI turns red.
    expect(add(2, 3)).toBe(5);
  });

  it("handles negative numbers", () => {
    expect(add(-1, 1)).toBe(0);
  });
});

describe("subtract()", () => {
  it("returns the difference", () => {
    expect(subtract(10, 4)).toBe(6);
  });
});

describe("isEven()", () => {
  it("returns true for even numbers", () => {
    expect(isEven(4)).toBe(true);
  });

  it("returns false for odd numbers", () => {
    expect(isEven(7)).toBe(false);
  });
});
