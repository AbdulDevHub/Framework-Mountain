// notificationService.js
// A service that sends notifications and uses the logger.
// In 09-spies, we'll spy on the logger to verify it's called correctly
// without fully replacing it.

import * as logger from './logger.js';

/**
 * Sends a welcome notification to a new user.
 * Logs an info message confirming the action.
 *
 * @param {{ name: string, email: string }} user
 * @returns {{ to: string, subject: string, body: string }}
 */
export function sendWelcomeEmail(user) {
  if (!user || !user.email) {
    logger.error('sendWelcomeEmail called with invalid user');
    throw new Error('Invalid user: email is required');
  }

  const notification = {
    to: user.email,
    subject: 'Welcome!',
    body: `Hi ${user.name}, welcome to our platform!`,
  };

  logger.info(`Welcome email sent to ${user.email}`);
  return notification;
}

/**
 * Sends an order confirmation notification.
 * Logs a warning if the order total seems unusually high.
 *
 * @param {string} email
 * @param {{ id: string, total: number }} order
 * @returns {{ to: string, subject: string, body: string }}
 */
export function sendOrderConfirmation(email, order) {
  if (order.total > 10_000) {
    logger.warn(`Unusually large order: ${order.id} for $${order.total}`);
  }

  logger.info(`Order confirmation sent to ${email} for order ${order.id}`);

  return {
    to: email,
    subject: `Order #${order.id} Confirmed`,
    body: `Your order total is $${order.total}`,
  };
}
