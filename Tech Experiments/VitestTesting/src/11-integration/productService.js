// productService.js
// Manages a catalog of products.
// Used in 11-integration to show how multiple real modules interact.

// In-memory product catalog (no database needed for this example)
const products = [
  { id: 1, name: 'Keyboard', price: 79.99, stock: 10 },
  { id: 2, name: 'Mouse', price: 39.99, stock: 5 },
  { id: 3, name: 'Monitor', price: 349.99, stock: 2 },
];

/**
 * Finds a product by ID.
 * Returns null if not found.
 * @param {number} id
 * @returns {object|null}
 */
export function getProduct(id) {
  return products.find((p) => p.id === id) ?? null;
}

/**
 * Checks if a product has enough stock for the requested quantity.
 * @param {number} productId
 * @param {number} quantity
 * @returns {boolean}
 */
export function hasStock(productId, quantity) {
  const product = getProduct(productId);
  return product !== null && product.stock >= quantity;
}

/**
 * Reduces the stock of a product by the given quantity.
 * Throws if there's not enough stock.
 * @param {number} productId
 * @param {number} quantity
 */
export function reduceStock(productId, quantity) {
  const product = getProduct(productId);
  if (!product) throw new Error(`Product ${productId} not found`);
  if (product.stock < quantity) throw new Error(`Insufficient stock for product ${productId}`);
  product.stock -= quantity;
}

/**
 * Resets all stock to initial values.
 * Called in test setup to restore original state.
 */
export function resetStock() {
  products[0].stock = 10;
  products[1].stock = 5;
  products[2].stock = 2;
}
