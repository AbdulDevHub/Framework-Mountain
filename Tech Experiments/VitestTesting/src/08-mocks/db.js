// db.js
// Simulates a database module.
// In the real world, this would connect to a database (SQL, MongoDB, etc.)
// In tests (08-mocks), we replace this entirely with vi.mock() so our
// tests never touch a real database.

/**
 * Finds a user record by ID.
 * In a real app, this would run a SQL query or call an ORM.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findUserById(id) {
  // Placeholder — in real code, this would query a database
  throw new Error('Real DB not available in this example. Use vi.mock() to mock this.');
}

/**
 * Saves a user record to the database.
 *
 * @param {object} user
 * @returns {Promise<object>} - The saved user (with id assigned)
 */
export async function saveUser(user) {
  throw new Error('Real DB not available in this example. Use vi.mock() to mock this.');
}

/**
 * Deletes a user record by ID.
 *
 * @param {number} id
 * @returns {Promise<boolean>} - true if deleted, false if not found
 */
export async function deleteUser(id) {
  throw new Error('Real DB not available in this example. Use vi.mock() to mock this.');
}
