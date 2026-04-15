/**
 * @module services/storage
 * @description Thin wrapper around localStorage with JSON serialisation.
 * All keys are namespaced under 'ck_travel_' to avoid collisions.
 */

const NS = 'ck_travel_';

/**
 * Retrieve a value from localStorage.
 * @template T
 * @param {string} key
 * @param {T} [fallback=null]
 * @returns {T}
 */
export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Store a value in localStorage.
 * @param {string} key
 * @param {*} value
 * @returns {boolean} true on success
 */
export function set(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a key from localStorage.
 * @param {string} key
 */
export function remove(key) {
  try {
    localStorage.removeItem(NS + key);
  } catch { /* ignore */ }
}

/** Storage keys used across the app */
export const KEYS = {
  ITINERARY:    'itinerary',
  LAST_QUERY:   'last_query',
  LAST_DEST:    'last_dest',
  ACTIVE_FILTERS: 'active_filters',
  VIEW_MODE:    'view_mode',
};
