// paymentService.js
// Handles payment processing logic.
// Used in 11-integration alongside productService and orderService.

// Simulated list of valid payment methods
const VALID_METHODS = ['credit_card', 'debit_card', 'paypal'];

/**
 * Processes a payment for a given amount using the specified method.
 *
 * Returns a payment receipt on success.
 * Throws if the method is unsupported or the amount is invalid.
 *
 * @param {number} amount
 * @param {string} method - e.g. 'credit_card', 'paypal'
 * @returns {{ transactionId: string, amount: number, method: string, status: string }}
 */
export function processPayment(amount, method) {
  if (!VALID_METHODS.includes(method)) {
    throw new Error(`Unsupported payment method: ${method}`);
  }
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  // Simulate a successful transaction (no real payment gateway here)
  return {
    transactionId: `TXN-${Date.now()}`,
    amount,
    method,
    status: 'success',
  };
}

/**
 * Validates whether a payment method string is supported.
 * @param {string} method
 * @returns {boolean}
 */
export function isSupportedMethod(method) {
  return VALID_METHODS.includes(method);
}
