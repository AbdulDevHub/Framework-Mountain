// counter.js
// A simple counter module with mutable state.
//
// Because this module holds state (the count value), tests can interfere
// with each other if that state isn't reset between tests.
// The 10-setup-teardown lesson shows exactly how to handle this with
// beforeEach / afterEach / beforeAll / afterAll hooks.

let count = 0;
let history = []; // Tracks every change made to the counter

/**
 * Returns the current count value.
 * @returns {number}
 */
export function getCount() {
  return count;
}

/**
 * Increments the count by a given amount (default: 1).
 * Records the change in history.
 * @param {number} [amount=1]
 */
export function increment(amount = 1) {
  count += amount;
  history.push({ action: 'increment', amount, result: count });
}

/**
 * Decrements the count by a given amount (default: 1).
 * Records the change in history.
 * @param {number} [amount=1]
 */
export function decrement(amount = 1) {
  count -= amount;
  history.push({ action: 'decrement', amount, result: count });
}

/**
 * Resets the counter to zero and clears the history.
 * Useful in afterEach hooks to isolate tests.
 */
export function reset() {
  count = 0;
  history = [];
}

/**
 * Returns a copy of the history log.
 * @returns {Array}
 */
export function getHistory() {
  return [...history];
}
