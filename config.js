/**
 * @module config
 * @description API configuration and environment variables.
 *
 * ─────────────────────────────────────────────────────────────────
 *  HOW TO SET UP YOUR API KEYS
 * ─────────────────────────────────────────────────────────────────
 *
 *  1. GEOAPIFY (Free tier: 3,000 requests/day — no credit card needed)
 *     a. Go to https://www.geoapify.com/ and click "Get Started Free"
 *     b. Create an account and verify your email
 *     c. In the dashboard, click "Create a New Project"
 *     d. Copy your API key and paste it as GEOAPIFY_KEY below
 *     e. The free plan supports: Geocoding, Places, Routing APIs
 *
 *  2. UNSPLASH (Free tier: 50 requests/hour)
 *     a. Go to https://unsplash.com/developers
 *     b. Click "Register as a developer" and log in
 *     c. Click "New Application", agree to terms
 *     d. Fill in your app name (e.g., "CK Travel Planner") and description
 *     e. Copy the "Access Key" (NOT the Secret Key) and paste as UNSPLASH_KEY below
 *
 *  ⚠️  SECURITY NOTE:
 *     These keys are exposed in client-side code. For Geoapify, restrict
 *     your key to your domain in the dashboard under API key settings.
 *     For production, consider a serverless proxy (e.g. Netlify Functions).
 * ─────────────────────────────────────────────────────────────────
 */

export const CONFIG = {
  /** Geoapify API key */
  GEOAPIFY_KEY: '8ae4b5c87cbe47d39ee5d1797c9f99bc',

  /** Unsplash Access Key — replace with your key from https://unsplash.com/developers */
  UNSPLASH_KEY: 'UYUJqIs3JuVTh6BhWUnUBIk4sjfpKl-vQmcrh0IZXds',

  /** Geoapify base URLs */
  GEOAPIFY_GEOCODE_URL: 'https://api.geoapify.com/v1/geocode/autocomplete',
  GEOAPIFY_PLACES_URL:  'https://api.geoapify.com/v2/places',

  /** Unsplash base URL */
  UNSPLASH_URL: 'https://api.unsplash.com/search/photos',

  /** Default photo dimensions for Unsplash */
  UNSPLASH_WIDTH: 750,

  /** Max results to fetch from Places API */
  PLACES_LIMIT: 20,
};

/**
 * Returns true if both API keys look like they've been filled in.
 * @returns {boolean}
 */
export function keysConfigured() {
  return (
    CONFIG.GEOAPIFY_KEY !== '8ae4b5c87cbe47d39ee5d1797c9f99bc' &&
    CONFIG.UNSPLASH_KEY !== 'UYUJqIs3JuVTh6BhWUnUBIk4sjfpKl-vQmcrh0IZXds'
  );
}
