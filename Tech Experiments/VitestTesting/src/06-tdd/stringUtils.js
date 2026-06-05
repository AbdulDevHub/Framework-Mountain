// stringUtils.js
// This file was built using Test-Driven Development (TDD).
//
// The process:
//   1. RED   — Write a failing test for a behaviour that doesn't exist yet
//   2. GREEN — Write the minimum code needed to make the test pass
//   3. REFACTOR — Clean up the code without breaking any tests
//
// The companion test file (stringUtils.test.js) shows these phases clearly.

/**
 * Reverses a string.
 * "hello" → "olleh"
 * @param {string} str
 * @returns {string}
 */
export function reverse(str) {
  return str.split('').reverse().join('');
}

/**
 * Returns true if the string is a palindrome (reads the same forwards and backwards).
 * Case-insensitive. Ignores spaces.
 * "racecar" → true
 * "A man a plan a canal Panama" → true
 * @param {string} str
 * @returns {boolean}
 */
export function isPalindrome(str) {
  // Normalize: lowercase, remove spaces
  const normalized = str.toLowerCase().replace(/\s+/g, '');
  return normalized === normalized.split('').reverse().join('');
}

/**
 * Counts how many times a substring appears in a string.
 * Case-sensitive.
 * countOccurrences("banana", "a") → 3
 * @param {string} str
 * @param {string} sub
 * @returns {number}
 */
export function countOccurrences(str, sub) {
  if (!sub) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) {
    count++;
    pos += sub.length;
  }
  return count;
}

/**
 * Truncates a string to a maximum length, appending "..." if it was cut.
 * If the string is already short enough, returns it unchanged.
 * truncate("Hello World", 5) → "Hello..."
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
