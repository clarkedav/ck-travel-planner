/**
 * @module utils/helpers
 * @description General-purpose utility functions.
 */

/**
 * Debounce a function — delays execution until after `delay` ms
 * have passed since the last invocation.
 * @param {Function} fn
 * @param {number} delay - milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Truncate text to a maximum character count, appending an ellipsis.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncateText(text, max = 80) {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max).trimEnd() + '…';
}

/**
 * Build an accessible star rating string and display markup.
 * @param {number|null} rating - 0–5 or null
 * @returns {{html: string, label: string}}
 */
export function buildStarRating(rating) {
  if (rating === null || rating === undefined) {
    return { html: '', label: 'No rating' };
  }
  const stars = Math.round(rating * 2) / 2; // round to nearest 0.5
  const full  = Math.floor(stars);
  const half  = stars % 1 !== 0;
  const empty = 5 - full - (half ? 1 : 0);

  const fullStar  = '<svg class="star-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const halfStar  = '<svg class="star-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="clip-path:inset(0 50% 0 0)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const emptyStar = '<svg class="star-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

  const html = fullStar.repeat(full)
    + (half ? halfStar : '')
    + emptyStar.repeat(empty);

  return {
    html:  `${html} <span>${rating.toFixed(1)}</span>`,
    label: `Rating: ${rating.toFixed(1)} out of 5`,
  };
}

/**
 * Format opening hours string for display.
 * @param {string|null} hours
 * @returns {string}
 */
export function formatHours(hours) {
  if (!hours) return 'Hours not available';
  return hours;
}

/**
 * Return a category emoji icon.
 * @param {string} category
 * @returns {string}
 */
export function categoryIcon(category = '') {
  const c = category.split('.')[0];
  const icons = {
    catering:      '🍽',
    tourism:       '🏛',
    leisure:       '🌿',
    entertainment: '🎭',
    commercial:    '🛍',
    accommodation: '🏨',
  };
  return icons[c] || '📍';
}

/**
 * Generate a Google Maps embed URL for a lat/lon.
 * @param {number} lat
 * @param {number} lon
 * @param {string} query
 * @returns {string}
 */
export function googleMapsEmbedUrl(lat, lon, query = '') {
  const q = encodeURIComponent(query || `${lat},${lon}`);
  return `https://maps.google.com/maps?q=${q}&output=embed&z=13`;
}
