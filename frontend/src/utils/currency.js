/**
 * Centralized Indian Currency (INR / ₹) Formatting Utilities
 *
 * Configured specifically for the Indian market using the Indian numbering system:
 * Examples:
 *   1,000       → ₹1,000
 *   10,000      → ₹10,000
 *   1,00,000    → ₹1,00,000
 *   1,50,000    → ₹1,50,000
 *   10,00,000   → ₹10,00,000
 *   1,00,00,000 → ₹1,00,00,000
 */

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

/**
 * Formats a numeric value or numeric string into Indian Rupee currency format (INR).
 *
 * @param {number|string|null|undefined} amount - The monetary amount to format.
 * @param {Object} [options={}] - Custom formatting options for Intl.NumberFormat.
 * @param {number} [options.maximumFractionDigits=0] - Maximum fraction digits (defaults to 0 for clean integers).
 * @param {number} [options.minimumFractionDigits=0] - Minimum fraction digits.
 * @returns {string} Formatted Indian Rupee string, e.g. "₹1,50,000"
 */
export function formatINR(amount, options = {}) {
  if (amount === null || amount === undefined || amount === '') {
    return `${CURRENCY_SYMBOL}0`;
  }

  const numericValue = typeof amount === 'number' ? amount : Number(amount);

  if (isNaN(numericValue)) {
    return `${CURRENCY_SYMBOL}0`;
  }

  const defaultOptions = {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    ...options
  };

  return new Intl.NumberFormat('en-IN', defaultOptions).format(numericValue);
}

/**
 * Formats an amount into INR with specified decimal precision.
 * Useful for financial calculations that explicitly require precision.
 *
 * @param {number|string} amount
 * @param {number} [decimals=2]
 * @returns {string} e.g. "₹1,50,000.50"
 */
export function formatINRWithDecimals(amount, decimals = 2) {
  return formatINR(amount, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formats a large number into compact Indian notation (Lakhs / Crores).
 * Examples:
 *   150000   → ₹1.5 Lakh
 *   25000000 → ₹2.5 Cr
 *
 * @param {number|string} amount
 * @returns {string}
 */
export function formatINRLakhCrore(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return `${CURRENCY_SYMBOL}0`;
  }

  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;

  if (Math.abs(num) >= 10000000) {
    const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
    return `${CURRENCY_SYMBOL}${cr} Cr`;
  } else if (Math.abs(num) >= 100000) {
    const lakh = (num / 100000).toFixed(2).replace(/\.00$/, '');
    return `${CURRENCY_SYMBOL}${lakh} Lakh`;
  }

  return formatINR(num);
}

/**
 * Formats a number with Indian grouping commas WITHOUT the currency symbol.
 * Example: 150000 → "1,50,000"
 *
 * @param {number|string} amount
 * @returns {string}
 */
export function formatNumberIN(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }

  const numericValue = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numericValue)) return '0';

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(numericValue);
}

/**
 * Parses an INR formatted string into a plain JavaScript number.
 * Example: "₹1,50,000" → 150000
 *
 * @param {string} formattedStr
 * @returns {number}
 */
export function parseINR(formattedStr) {
  if (!formattedStr) return 0;
  const cleanStr = String(formattedStr).replace(/[^\d.-]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

export default formatINR;
