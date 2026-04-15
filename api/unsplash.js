/**
 * @module api/unsplash
 * @description Fetches destination photos from the Unsplash API.
 * Results are cached in sessionStorage to stay under the
 * 50 req/hr Demo tier limit.
 */

import { CONFIG } from '../config.js';

const CACHE_PREFIX = 'ck_unsplash_';

/**
 * Fetch a photo URL for a given search query.
 * Returns a cached result when available.
 *
 * @param {string} query - Search term (e.g., place name or destination city)
 * @param {string} [orientation='landscape'] - 'landscape' | 'portrait' | 'squarish'
 * @returns {Promise<string|null>} Photo URL or null if unavailable
 */
export async function getPhoto(query, orientation = 'landscape') {
  if (!query) return null;

  const cacheKey = CACHE_PREFIX + query.toLowerCase().replace(/\s+/g, '_');

  // ── Check cache first ──
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // sessionStorage unavailable — proceed without caching
  }

  // ── Fetch from Unsplash ──
  const url = new URL(CONFIG.UNSPLASH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', orientation);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('content_filter', 'high');
  url.searchParams.set('client_id', CONFIG.UNSPLASH_KEY);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    const photoUrl = data.results?.[0]?.urls?.regular ?? null;

    // ── Store in cache ──
    if (photoUrl) {
      try {
        sessionStorage.setItem(cacheKey, photoUrl);
      } catch {
        // Storage quota exceeded — ignore
      }
    }

    return photoUrl;
  } catch {
    return null;
  }
}

/**
 * Batch-fetch photos for an array of place objects.
 * Mutates each place's `photoUrl` property in-place.
 * Falls back to a destination city query if the place name yields nothing.
 *
 * @param {Array<{name: string, photoUrl: string|null}>} places
 * @param {string} destName - Fallback city/destination name
 * @returns {Promise<void>}
 */
export async function enrichWithPhotos(places, destName = '') {
  await Promise.allSettled(
    places.map(async place => {
      const url = await getPhoto(place.name) || await getPhoto(destName);
      place.photoUrl = url;
    })
  );
}
