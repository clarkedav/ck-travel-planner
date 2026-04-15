/**
 * @module components/mapView
 * @description Manages the Google Maps iframe embed for the Map View toggle.
 * Shows an embedded map centered on the current destination,
 * and updates query when the user browses or saves places.
 */

const mapSection  = document.getElementById('map-section');
const mapIframe   = document.getElementById('map-iframe');
const mapOverlay  = document.getElementById('map-overlay');
const gridViewBtn = document.getElementById('grid-view-btn');
const mapViewBtn  = document.getElementById('map-view-btn');
const resultsSection = document.getElementById('results-section');

/** Current destination coordinates */
let currentLat = null;
let currentLon = null;
let currentDest = '';

/* ══════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════ */

/**
 * Initialise the map view toggle buttons.
 */
export function initMapView() {
  gridViewBtn.addEventListener('click', () => showGridView());
  mapViewBtn.addEventListener('click',  () => showMapView());
}

/**
 * Set the current destination for the map.
 * @param {number} lat
 * @param {number} lon
 * @param {string} destName
 */
export function setDestination(lat, lon, destName) {
  currentLat  = lat;
  currentLon  = lon;
  currentDest = destName;
}

/**
 * Switch to map view and load the destination embed.
 */
export function showMapView() {
  gridViewBtn.classList.remove('view-btn--active');
  gridViewBtn.setAttribute('aria-pressed', 'false');
  mapViewBtn.classList.add('view-btn--active');
  mapViewBtn.setAttribute('aria-pressed', 'true');

  resultsSection.hidden = true;
  mapSection.hidden     = false;

  if (currentLat !== null) {
    loadMap(currentLat, currentLon, currentDest);
    mapOverlay.classList.add('hidden');
  }
}

/**
 * Switch back to card grid view.
 */
export function showGridView() {
  mapViewBtn.classList.remove('view-btn--active');
  mapViewBtn.setAttribute('aria-pressed', 'false');
  gridViewBtn.classList.add('view-btn--active');
  gridViewBtn.setAttribute('aria-pressed', 'true');

  mapSection.hidden     = true;
  resultsSection.hidden = false;
}

/**
 * Returns true if the map view is currently active.
 * @returns {boolean}
 */
export function isMapViewActive() {
  return !mapSection.hidden;
}

/* ══════════════════════════════════════════
   PRIVATE
══════════════════════════════════════════ */

/**
 * Load the Google Maps embed iframe with the given location.
 * @param {number} lat
 * @param {number} lon
 * @param {string} query - Human-readable destination
 */
function loadMap(lat, lon, query) {
  const q   = encodeURIComponent(query || `${lat},${lon}`);
  const src = `https://maps.google.com/maps?q=${q}&output=embed&z=13&ll=${lat},${lon}`;
  mapIframe.src = src;
}
