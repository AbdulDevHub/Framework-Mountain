// matchers-demo.js
// This module returns various data types so we can demonstrate
// the full range of Vitest matchers in the companion test file.

/**
 * Returns a plain string greeting.
 */
export function getGreeting() {
  return 'Hello, World!';
}

/**
 * Returns a whole number (integer).
 */
export function getScore() {
  return 42;
}

/**
 * Returns a floating-point number (useful for toBeCloseTo).
 */
export function getPiApproximation() {
  return 0.1 + 0.2; // Famous JS floating-point quirk: 0.30000000000000004
}

/**
 * Returns true — a truthy boolean.
 */
export function isActive() {
  return true;
}

/**
 * Returns false — a falsy boolean.
 */
export function isDeleted() {
  return false;
}

/**
 * Returns an array of strings.
 */
export function getColors() {
  return ['red', 'green', 'blue'];
}

/**
 * Returns a plain object representing a user.
 */
export function getUser() {
  return { id: 1, name: 'Alice', role: 'admin' };
}

/**
 * Returns null explicitly.
 */
export function getNothing() {
  return null;
}

/**
 * Returns undefined explicitly.
 */
export function getMissing() {
  return undefined;
}

/**
 * Returns a large number so we can test toBeGreaterThan, toBeLessThan, etc.
 */
export function getPopulation() {
  return 8_000_000_000; // ~8 billion
}
