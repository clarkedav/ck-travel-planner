/**
 * @module utils/seo
 * @description Updates document.title and Open Graph meta tags
 * dynamically when the user selects a new destination.
 */

const BASE_TITLE = 'CK Travel Planner';

/**
 * Update the page title and all relevant meta tags for a destination.
 * @param {string} destination - e.g. "Lagos, Nigeria"
 */
export function updateSEO(destination) {
  if (!destination) {
    resetSEO();
    return;
  }

  const title       = `Exploring ${destination} — ${BASE_TITLE}`;
  const description = `Discover the best attractions, restaurants, and hidden gems in ${destination}. Plan your perfect trip with CK Travel Planner.`;
  const url         = window.location.href;

  // Document title
  document.title = title;

  // Update or create meta tags
  setMeta('name',      'description',    description);
  setMeta('property',  'og:title',       title);
  setMeta('property',  'og:description', description);
  setMeta('property',  'og:url',         url);
  setMeta('name',      'twitter:title',  title);
  setMeta('name',      'twitter:description', description);
}

/**
 * Reset SEO metadata to defaults (called when no destination is active).
 */
export function resetSEO() {
  const desc = 'Your curated travel companion. Search destinations and build itineraries with ease.';
  document.title = BASE_TITLE;
  setMeta('name',      'description',    desc);
  setMeta('property',  'og:title',       BASE_TITLE);
  setMeta('property',  'og:description', desc);
  setMeta('name',      'twitter:title',  BASE_TITLE);
  setMeta('name',      'twitter:description', desc);
}

/**
 * Set a <meta> tag value, creating the element if it doesn't exist.
 * @param {string} attrName  - e.g. 'name' or 'property'
 * @param {string} attrValue - e.g. 'description' or 'og:title'
 * @param {string} content
 */
function setMeta(attrName, attrValue, content) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
