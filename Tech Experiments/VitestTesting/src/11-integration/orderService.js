// orderService.js
// Orchestrates an order: checks stock, calculates totals, and processes payment.
// This is the "glue" module that ties productService and paymentService together.
//
// In 11-integration, we test ALL THREE modules working together — no mocking.

import { getProduct, hasStock, reduceStock } from './productService.js';
import { processPayment } from './paymentService.js';

/**
 * Places an order for one or more items.
 *
 * Steps:
 *  1. Validate each item has enough stock
 *  2. Calculate the total price
 *  3. Process payment
 *  4. Reduce stock for each item
 *  5. Return an order receipt
 *
 * @param {Array<{ productId: number, quantity: number }>} items
 * @param {string} paymentMethod
 * @returns {{ orderId: string, items: Array, total: number, payment: object }}
 */
export function placeOrder(items, paymentMethod) {
  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Step 1: Check stock for all items before doing anything else
  for (const item of items) {
    const product = getProduct(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} does not exist`);
    }
    if (!hasStock(item.productId, item.quantity)) {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }
  }

  // Step 2: Calculate total
  const orderItems = items.map((item) => {
    const product = getProduct(item.productId);
    return {
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // Step 3: Process payment
  const payment = processPayment(total, paymentMethod);

  // Step 4: Deduct stock (only after payment succeeds)
  for (const item of items) {
    reduceStock(item.productId, item.quantity);
  }

  // Step 5: Return receipt
  return {
    orderId: `ORD-${Date.now()}`,
    items: orderItems,
    total,
    payment,
  };
}
