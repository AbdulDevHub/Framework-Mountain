// userService.js
// A service layer that depends on the database (db.js).
// The service contains the business logic; it delegates data access to db.js.
//
// This separation is key:
//   - In production: db.js does real database work
//   - In tests:      db.js is mocked, so we only test userService logic

import { findUserById, saveUser, deleteUser } from './db.js';

/**
 * Retrieves a user by ID.
 * Throws a descriptive error if the user doesn't exist.
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getUser(id) {
  const user = await findUserById(id);
  if (!user) {
    throw new Error(`User ${id} not found`);
  }
  return user;
}

/**
 * Creates a new user after validating the input.
 * - Name must be non-empty
 * - Email must contain "@"
 *
 * @param {{ name: string, email: string }} userData
 * @returns {Promise<object>}
 */
export async function createUser(userData) {
  if (!userData.name || userData.name.trim() === '') {
    throw new Error('Name is required');
  }
  if (!userData.email || !userData.email.includes('@')) {
    throw new Error('Valid email is required');
  }

  // Delegate the actual saving to the db layer
  const savedUser = await saveUser(userData);
  return savedUser;
}

/**
 * Removes a user by ID.
 * Returns true on success, false if the user wasn't found.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function removeUser(id) {
  return deleteUser(id);
}
