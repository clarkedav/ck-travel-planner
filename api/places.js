/**
 * @module api/places
 * @description Encapsulates all Geoapify API calls.
 * Uses Geocoding autocomplete for destination search and
 * Places API for nearby point-of-interest lookup.
 */

import { CONFIG } from '../config.js';

/**
 * Category map: UI filter value → Geoapify categories string
 * Geoapify docs: https://apidocs.geoapify.com/docs/places/
 */
const CATEGORY_MAP = {
  all:           'catering,tourism,leisure,entertainment,commercial,accommodation',
  catering:      'catering',
  tourism:       'tourism',
  leisure:       'leisure',
  entertainment: 'entertainment',
  commercial:    'commercial.shopping_mall,commercial.department_store,commercial.clothing',
  accommodation: 'accommodation',
};

/**
 * Human-readable category labels.
 * @param {string} cat - raw Geoapify category string
 * @returns {string}
 */
export function formatCategory(cat = '') {
  if (!cat) return 'Place';
  const first = cat.split('.')[0];
  const labels = {
    catering:      '🍽 Food & Dining',
    tourism:       '🏛 Culture & History',
    leisure:       '🌿 Outdoor & Leisure',
    entertainment: '🎭 Entertainment',
    commercial:    '🛍 Shopping',
    accommodation: '🏨 Hotel',
  };
  return labels[first] || first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * Autocomplete a destination query string via Geoapify geocoding.
 * @param {string} query - User's typed string
 * @returns {Promise<Array<{name: string, lat: number, lon: number, country: string}>>}
 */
export async function autocompleteDest(query) {
  if (!query || query.trim().length < 2) return [];

  const url = new URL(CONFIG.GEOAPIFY_GEOCODE_URL);
  url.searchParams.set('text', query.trim());
  url.searchParams.set('type', 'city');
  url.searchParams.set('limit', '5');
  url.searchParams.set('apiKey', CONFIG.GEOAPIFY_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Geocode error: ${res.status}`);

  const data = await res.json();

  return (data.features || []).map(f => ({
    name:    f.properties.city || f.properties.name || f.properties.formatted,
    country: f.properties.country || '',
    formatted: f.properties.formatted || '',
    lat:     f.geometry.coordinates[1],
    lon:     f.geometry.coordinates[0],
  }));
}

/**
 * Search for places near a lat/lon coordinate.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [category='all'] - Filter category key
 * @returns {Promise<Array>} Array of normalised place objects
 */
export async function searchPlaces(lat, lon, category = 'all') {
  const cats = CATEGORY_MAP[category] || CATEGORY_MAP.all;

  const url = new URL(CONFIG.GEOAPIFY_PLACES_URL);
  url.searchParams.set('categories', cats);
  url.searchParams.set('filter', `circle:${lon},${lat},5000`);
  url.searchParams.set('bias', `proximity:${lon},${lat}`);
  url.searchParams.set('limit', String(CONFIG.PLACES_LIMIT));
  url.searchParams.set('apiKey', CONFIG.GEOAPIFY_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Places API error: ${res.status}`);

  const data = await res.json();
  return (data.features || []).map(normalisePlaceFeature);
}

/**
 * Normalise a Geoapify feature into our internal place shape.
 * @param {object} feature
 * @returns {object}
 */
function normalisePlaceFeature(feature) {
  const p = feature.properties || {};
  return {
    id:        p.place_id || feature.id || Math.random().toString(36).slice(2),
    name:      p.name || 'Unnamed Place',
    category:  p.categories?.[0] || '',
    address:   p.formatted || p.address_line1 || '',
    lat:       feature.geometry?.coordinates?.[1] ?? 0,
    lon:       feature.geometry?.coordinates?.[0] ?? 0,
    rating:    p.datasource?.raw?.stars ?? p.datasource?.raw?.rating ?? null,
    website:   p.website || p.datasource?.raw?.website || null,
    phone:     p.phone || p.datasource?.raw?.phone || null,
    openNow:   p.opening_hours ? p.opening_hours.toLowerCase().includes('open') : null,
    hours:     p.opening_hours || null,
    mapsUrl:   `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name || '')}+${feature.geometry?.coordinates?.[1] ?? ''},${feature.geometry?.coordinates?.[0] ?? ''}`,
    photoUrl:  null, // filled in by unsplash.js
  };
}
