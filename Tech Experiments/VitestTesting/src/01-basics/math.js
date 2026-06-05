// math.js
// A simple utility module with basic arithmetic operations.
// This file is intentionally small — it exists to be tested, not to impress.

/**
 * Adds two numbers together.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function add(a, b) {
  return a + b;
}

/**
 * Subtracts b from a.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function subtract(a, b) {
  return a - b;
}

/**
 * Multiplies two numbers together.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function multiply(a, b) {
  return a * b;
}

/**
 * Divides a by b.
 * Throws an error if b is zero (you can't divide by zero!).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function divide(a, b) {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}
