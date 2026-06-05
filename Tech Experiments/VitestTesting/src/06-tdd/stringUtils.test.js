// ─────────────────────────────────────────────────────────────────────────────
// 06-tdd/stringUtils.test.js
//
// CONCEPT: Test-Driven Development (TDD) — Red → Green → Refactor
//
// TDD is a development technique where you write the TEST before the CODE.
// This might feel backwards, but it has powerful benefits:
//   - Forces you to think about the interface before the implementation
//   - Gives you confidence that your code does exactly what you specified
//   - Catches regressions automatically as you refactor
//
// THE TDD CYCLE:
//   🔴 RED    — Write a test that describes the behaviour you want.
//               Run it. It MUST fail (the code doesn't exist yet).
//               A passing test before writing code means your test is wrong.
//
//   🟢 GREEN  — Write the MINIMUM code needed to make the test pass.
//               Don't over-engineer. Don't add features that aren't tested.
//               Just get to green.
//
//   🔵 REFACTOR — Clean up the code (and the test) without breaking anything.
//               Run the tests again. They should still be green.
//               Repeat the cycle for the next feature.
//
// In this file, comments mark which phase each test was written for.
// The implementation in stringUtils.js already exists (it was written after
// these tests, following the cycle above).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { reverse, isPalindrome, countOccurrences, truncate } from './stringUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// reverse()
// TDD Phase: How we thought about this function before writing it.
// ─────────────────────────────────────────────────────────────────────────────
describe('reverse()', () => {

  // 🔴 RED: Write this test first, before reverse() existed
  it('reverses a simple string', () => {
    expect(reverse('hello')).toBe('olleh');
  });

  // 🔴 RED: Edge case — what happens with a single character?
  it('returns a single character unchanged', () => {
    expect(reverse('a')).toBe('a');
  });

  // 🔴 RED: Edge case — what about an empty string?
  it('returns an empty string when given an empty string', () => {
    expect(reverse('')).toBe('');
  });

  // 🔴 RED: Does it handle spaces correctly?
  it('reverses a string with spaces', () => {
    expect(reverse('hello world')).toBe('dlrow olleh');
  });

  // 🔵 REFACTOR: After implementation was working, we added this check
  // to ensure double-reversing returns the original string.
  it('reversing twice returns the original string', () => {
    const original = 'testing';
    expect(reverse(reverse(original))).toBe(original);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isPalindrome()
// ─────────────────────────────────────────────────────────────────────────────
describe('isPalindrome()', () => {

  // 🔴 RED: The obvious case
  it('returns true for a simple palindrome', () => {
    expect(isPalindrome('racecar')).toBe(true);
  });

  // 🔴 RED: Non-palindrome
  it('returns false for a non-palindrome', () => {
    expect(isPalindrome('hello')).toBe(false);
  });

  // 🔴 RED: Case sensitivity — we decided it should be case-insensitive
  it('is case-insensitive', () => {
    expect(isPalindrome('Racecar')).toBe(true);
    expect(isPalindrome('MADAM')).toBe(true);
  });

  // 🔴 RED: Spaces — famous palindromes have spaces
  it('ignores spaces', () => {
    expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
  });

  // 🔴 RED: Single character is always a palindrome
  it('returns true for a single character', () => {
    expect(isPalindrome('a')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// countOccurrences()
// ─────────────────────────────────────────────────────────────────────────────
describe('countOccurrences()', () => {

  // 🔴 RED: Basic counting
  it('counts how many times a substring appears', () => {
    expect(countOccurrences('banana', 'a')).toBe(3);
  });

  it('returns 0 when the substring is not found', () => {
    expect(countOccurrences('banana', 'z')).toBe(0);
  });

  it('counts multi-character substrings', () => {
    expect(countOccurrences('abcabcabc', 'abc')).toBe(3);
  });

  // 🔴 RED: Edge case — empty substring
  it('returns 0 for an empty substring', () => {
    expect(countOccurrences('banana', '')).toBe(0);
  });

  // 🔵 REFACTOR: Verified after refactoring that overlapping isn't double-counted
  it('does not double-count overlapping patterns', () => {
    // 'aa' appears once in 'aaa' non-overlappingly (positions 0 and 2 would overlap)
    expect(countOccurrences('aaa', 'aa')).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// truncate()
// ─────────────────────────────────────────────────────────────────────────────
describe('truncate()', () => {

  // 🔴 RED: Main behaviour — long strings get cut
  it('truncates a string that exceeds the max length', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  // 🔴 RED: Short strings should be returned as-is
  it('returns the string unchanged if it is within the max length', () => {
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  // 🔴 RED: Exact length boundary
  it('returns the string unchanged when length exactly equals maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  // 🔴 RED: Empty string edge case
  it('returns an empty string when given an empty string', () => {
    expect(truncate('', 5)).toBe('');
  });
});
