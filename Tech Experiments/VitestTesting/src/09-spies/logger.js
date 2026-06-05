// logger.js
// A simple logging utility.
//
// In 09-spies, we use vi.spyOn() to *observe* calls to this logger
// without completely replacing it (unlike vi.mock() which replaces everything).
// This lets us verify that a function *used* the logger while still letting
// the logger run its real code.

/**
 * Logs an informational message to the console.
 * @param {string} message
 */
export function info(message) {
  console.log(`[INFO]  ${new Date().toISOString()} — ${message}`);
}

/**
 * Logs a warning message to the console.
 * @param {string} message
 */
export function warn(message) {
  console.warn(`[WARN]  ${new Date().toISOString()} — ${message}`);
}

/**
 * Logs an error message to the console.
 * @param {string} message
 */
export function error(message) {
  console.error(`[ERROR] ${new Date().toISOString()} — ${message}`);
}
