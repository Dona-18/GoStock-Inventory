/**
 * Date helper utilities for GoStock.
 */

/**
 * Returns today's date as a YYYY-MM-DD string.
 */
export function todayKey() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

/**
 * Format a ISO date string to a readable local date.
 * e.g. "May 22, 2026" or "២២ ឧសភា ២០២៦"
 */
export function formatDate(isoString, locale = 'km') {
  if (!isoString) return '';
  const d = new Date(isoString);
  const targetLocale = locale === 'km' ? 'km-KH' : 'en-US';
  try {
    return d.toLocaleDateString(targetLocale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    // Basic fallback if locale formatting fails
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

/**
 * Format a ISO date string to time only.
 * e.g. "3:45 PM"
 */
export function formatTime(isoString, locale = 'km') {
  if (!isoString) return '';
  const d = new Date(isoString);
  const targetLocale = locale === 'km' ? 'km-KH' : 'en-US';
  try {
    return d.toLocaleTimeString(targetLocale, { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}

/**
 * Check if two ISO strings fall on the same calendar day.
 */
export function isSameDay(isoA, isoB) {
  return isoA?.split('T')[0] === isoB?.split('T')[0];
}

/**
 * Get the YYYY-MM-DD key for a given Date object.
 */
export function dateKey(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Return the last N days as YYYY-MM-DD keys.
 */
export function lastNDaysKeys(n) {
  const keys = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}
