// validators.js
// A collection of simple validation/transformation utilities.
// These are perfect for it.each because they have clear inputs and outputs.

/**
 * Returns true if the number is even, false otherwise.
 * @param {number} n
 * @returns {boolean}
 */
export function isEven(n) {
  return n % 2 === 0;
}

/**
 * Returns true if the number is positive (greater than zero).
 * Zero is NOT considered positive.
 * @param {number} n
 * @returns {boolean}
 */
export function isPositive(n) {
  return n > 0;
}

/**
 * Capitalizes the first letter of a string and lowercases the rest.
 * Returns an empty string if the input is empty.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
