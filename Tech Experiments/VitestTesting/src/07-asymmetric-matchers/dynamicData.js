// dynamicData.js
// Functions that return objects with dynamic / unpredictable values
// (e.g. generated IDs, timestamps, random elements).
//
// You can't hardcode expected values for these — that's exactly why
// asymmetric matchers exist. See the test file for examples.

/**
 * Creates a new user record.
 * The `id` is generated at call time (simulating a database auto-increment or UUID).
 * The `createdAt` is the current timestamp.
 *
 * @param {string} name
 * @param {string} email
 * @returns {{ id: number, name: string, email: string, createdAt: string, role: string }}
 */
export function createUser(name, email) {
  return {
    id: Math.floor(Math.random() * 1_000_000), // unpredictable!
    name,
    email,
    createdAt: new Date().toISOString(), // changes every millisecond!
    role: 'user',
  };
}

/**
 * Generates an order summary object.
 * Order numbers are random; timestamps are live.
 *
 * @param {string[]} items  - List of item names
 * @param {number}   total  - Total price
 * @returns {object}
 */
export function createOrder(items, total) {
  return {
    orderNumber: `ORD-${Math.floor(Math.random() * 99999)}`,
    items,
    total,
    currency: 'USD',
    placedAt: new Date().toISOString(),
    status: 'pending',
  };
}

/**
 * Returns a paginated response object.
 * @param {Array}  data  - The page's data
 * @param {number} page  - Current page number
 * @param {number} total - Total number of records
 */
export function paginatedResponse(data, page, total) {
  return {
    data,
    meta: {
      page,
      total,
      pageSize: data.length,
      generatedAt: new Date().toISOString(),
    },
  };
}
