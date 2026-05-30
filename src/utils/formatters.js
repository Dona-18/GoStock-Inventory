/**
 * Format a number as USD currency.
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return `$${Number(amount).toFixed(2)}`;
}

/**
 * Format a number as KHR (Cambodian Riel).
 * @param {number} amount
 * @returns {string}
 */
export function formatKHR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ៛';
  return `${Math.round(Number(amount)).toLocaleString()} ៛`;
}

/**
 * Clamp a numeric value to a min/max range.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
