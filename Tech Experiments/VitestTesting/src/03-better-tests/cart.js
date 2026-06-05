// cart.js
// A minimal shopping cart module.
// Supports adding items, removing items, and calculating the total price.
// Kept deliberately simple — the goal is to have something meaningful to test.

/**
 * Creates a new empty shopping cart.
 * Returns an object with cart operations as methods.
 *
 * @returns {{ items: Array, addItem: Function, removeItem: Function, getTotal: Function }}
 */
export function createCart() {
  // Internal state: a list of cart items
  const items = [];

  return {
    /**
     * The raw list of items (for inspection in tests).
     * In real code, you might not expose this directly.
     */
    get items() {
      return items;
    },

    /**
     * Adds an item to the cart.
     * @param {{ name: string, price: number, quantity: number }} item
     */
    addItem(item) {
      // Check if the item already exists (by name) and increase quantity
      const existing = items.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        items.push({ ...item });
      }
    },

    /**
     * Removes an item from the cart by name.
     * Does nothing if the item doesn't exist.
     * @param {string} name
     */
    removeItem(name) {
      const index = items.findIndex((i) => i.name === name);
      if (index !== -1) {
        items.splice(index, 1);
      }
    },

    /**
     * Calculates the total price of all items in the cart.
     * Total = sum of (price × quantity) for each item.
     * @returns {number}
     */
    getTotal() {
      return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
  };
}
