/**
 * @module main
 * @description Application entry point.
 * Imports all modules, initialises event listeners, and boots the app.
 *
 * Data flow:
 *   User types → autocompleteDest → show suggestions
 *   User selects destination → searchPlaces → enrichWithPhotos → renderCards
 *   User clicks card → openPlaceModal
 *   User saves place → toggleSave → updateCardSaveState → updateSaveButton
 *   User filters → filterCards (client-side, no re-fetch)
 */

import { CONFIG, keysConfigured }    from './config.js';
import { autocompleteDest, searchPlaces } from './api/places.js';
import { enrichWithPhotos }          from './api/unsplash.js';
import { createCard, createSkeletonCards, updateCardSaveState } from './components/card.js';
import { initModal, openPlaceModal, updateSaveButton, getCurrentPlace } from './components/modal.js';
import { initFilters, getActiveCategory, setActiveCategory } from './components/filters.js';
import { initItinerary, toggleSave, isSaved, getItems } from './components/itinerary.js';
import { initMapView, setDestination, showGridView, isMapViewActive } from './components/mapView.js';
import { showToast }                 from './components/toast.js';
import { get, set, KEYS }            from './services/storage.js';
import { debounce }                  from './utils/helpers.js';
import { updateSEO, resetSEO }       from './utils/seo.js';

/* ══════════════════════════════════════════
   DOM REFERENCES
══════════════════════════════════════════ */
const searchInput      = document.getElementById('search-input');
const suggestionsList  = document.getElementById('search-suggestions');
const heroSection      = document.getElementById('hero-section');
const destHeader       = document.getElementById('destination-header');
const destTitle        = document.getElementById('destination-title');
const resultsCount     = document.getElementById('results-count');
const filtersSection   = document.getElementById('filters-section');
const cardGrid         = document.getElementById('card-grid');
const resultsSection   = document.getElementById('results-section');

/* ══════════════════════════════════════════
   APP STATE
══════════════════════════════════════════ */

/** @type {Array<object>} All fetched places for current destination */
let allPlaces = [];

/** @type {{name: string, lat: number, lon: number}|null} */
let currentDest = null;

/** @type {boolean} */
let isLoading = false;

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */

function boot() {
  // Warn if keys not configured
  if (!keysConfigured()) {
    showApiWarning();
  }

  // Initialise modules
  initModal(handleSaveFromModal);
  initFilters(handleFilterChange);
  initItinerary(handleSaveStateChange);
  initMapView();

  // Wire up search
  searchInput.addEventListener('input', debounce(handleSearchInput, 300));
  searchInput.addEventListener('keydown', handleSearchKeydown);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= 2) showSuggestions();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.navbar__search')) hideSuggestions();
  });

  // Card grid events (event delegation)
  cardGrid.addEventListener('card:click', e => handleCardClick(e.detail.place));
  cardGrid.addEventListener('card:save',  e => handleCardSave(e.detail.place));

  // Hero suggestion pills
  document.querySelectorAll('.hero__suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      searchInput.value = btn.dataset.query;
      searchInput.dispatchEvent(new Event('input'));
    });
  });

  // Restore last session
  restoreSession();
}

/* ══════════════════════════════════════════
   SEARCH
══════════════════════════════════════════ */

async function handleSearchInput() {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    hideSuggestions();
    return;
  }

  try {
    const results = await autocompleteDest(query);
    renderSuggestions(results);
  } catch (err) {
    console.error('Autocomplete error:', err);
    hideSuggestions();
  }
}

function handleSearchKeydown(e) {
  const items = suggestionsList.querySelectorAll('.search-suggestion-item');
  const active = suggestionsList.querySelector('[aria-selected="true"]');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = active
      ? active.nextElementSibling || items[0]
      : items[0];
    setActiveSuggestion(next);
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = active
      ? active.previousElementSibling || items[items.length - 1]
      : items[items.length - 1];
    setActiveSuggestion(prev);
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (active) {
      active.click();
    } else if (items.length > 0) {
      items[0].click();
    }
  }

  if (e.key === 'Escape') {
    hideSuggestions();
    searchInput.blur();
  }
}

function renderSuggestions(results) {
  suggestionsList.innerHTML = '';

  if (!results.length) {
    hideSuggestions();
    return;
  }

  results.forEach((dest, i) => {
    const li = document.createElement('li');
    li.className = 'search-suggestion-item';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.id = `suggestion-${i}`;
    li.innerHTML = `
      <span class="search-suggestion-item__icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </span>
      <span>${escHtml(dest.formatted || dest.name)}</span>
    `;
    li.addEventListener('click', () => selectDestination(dest));
    suggestionsList.appendChild(li);
  });

  suggestionsList.hidden = false;
  searchInput.setAttribute('aria-expanded', 'true');
}

function setActiveSuggestion(el) {
  suggestionsList.querySelectorAll('[aria-selected="true"]')
    .forEach(e => e.setAttribute('aria-selected', 'false'));
  if (el) {
    el.setAttribute('aria-selected', 'true');
    el.scrollIntoView({ block: 'nearest' });
  }
}

function showSuggestions() {
  if (suggestionsList.children.length > 0) {
    suggestionsList.hidden = false;
  }
}

function hideSuggestions() {
  suggestionsList.hidden = true;
  searchInput.setAttribute('aria-expanded', 'false');
}

/* ══════════════════════════════════════════
   DESTINATION SELECTION
══════════════════════════════════════════ */

async function selectDestination(dest) {
  hideSuggestions();
  searchInput.value = dest.formatted || dest.name;
  searchInput.blur();

  currentDest = dest;
  set(KEYS.LAST_DEST, dest);

  // Reset filter to 'all'
  setActiveCategory('all');

  // Update map destination
  setDestination(dest.lat, dest.lon, dest.formatted || dest.name);

  // Update SEO
  updateSEO(dest.formatted || dest.name);

  // Show destination UI
  showDestinationUI(dest.formatted || dest.name);

  // If map view is active, switch back to grid
  if (isMapViewActive()) showGridView();

  await fetchAndRenderPlaces(dest.lat, dest.lon, 'all');
}

function showDestinationUI(name) {
  heroSection.hidden    = true;
  destHeader.hidden     = false;
  filtersSection.hidden = false;
  destTitle.textContent = name;
}

/* ══════════════════════════════════════════
   PLACES FETCH & RENDER
══════════════════════════════════════════ */

async function fetchAndRenderPlaces(lat, lon, category = 'all') {
  if (isLoading) return;
  isLoading = true;

  resultsSection.setAttribute('aria-busy', 'true');
  renderSkeletons();

  try {
    const places = await searchPlaces(lat, lon, category);
    allPlaces = places;

    // Fetch photos in background — render cards first, update photos as they arrive
    renderCards(places);
    enrichWithPhotos(places, currentDest?.name || '')
      .then(() => renderCards(places)); // re-render with photos

  } catch (err) {
    console.error('Places fetch error:', err);
    renderError(() => fetchAndRenderPlaces(lat, lon, category));
  } finally {
    isLoading = false;
    resultsSection.setAttribute('aria-busy', 'false');
  }
}

function renderCards(places) {
  cardGrid.innerHTML = '';

  if (!places.length) {
    renderEmptyState();
    return;
  }

  const fragment = document.createDocumentFragment();
  places.forEach(place => {
    const card = createCard(place, isSaved(place.id));
    fragment.appendChild(card);
  });

  cardGrid.appendChild(fragment);
  updateResultsCount(places.length);
}

function renderSkeletons(count = 8) {
  cardGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  createSkeletonCards(count).forEach(el => fragment.appendChild(el));
  cardGrid.appendChild(fragment);
  updateResultsCount(null);
}

function renderEmptyState() {
  cardGrid.innerHTML = `
    <div class="empty-state" role="status">
      <div class="empty-state__icon" aria-hidden="true">🔍</div>
      <h3 class="empty-state__title">No places found</h3>
      <p>Try a different category or destination.</p>
    </div>
  `;
  updateResultsCount(0);
}

function renderError(retryFn) {
  cardGrid.innerHTML = `
    <div class="error-state" role="alert">
      <div class="error-state__icon" aria-hidden="true">⚠️</div>
      <h3 class="error-state__title">Something went wrong</h3>
      <p class="error-state__message">We couldn't load places right now. Check your connection or API key.</p>
      <button class="btn btn--retry" id="retry-btn">Try Again</button>
    </div>
  `;
  document.getElementById('retry-btn')?.addEventListener('click', retryFn);
  updateResultsCount(null);
}

function updateResultsCount(count) {
  if (count === null) {
    resultsCount.textContent = '';
  } else {
    resultsCount.textContent = `${count} place${count !== 1 ? 's' : ''} found`;
  }
}

/* ══════════════════════════════════════════
   FILTERS (client-side)
══════════════════════════════════════════ */

/**
 * Called when the active filter changes.
 * Filters the already-fetched allPlaces array client-side.
 * Falls back to a fresh API fetch if no places are loaded.
 * @param {string} category
 */
async function handleFilterChange(category) {
  if (!currentDest) return;

  if (!allPlaces.length) {
    await fetchAndRenderPlaces(currentDest.lat, currentDest.lon, category);
    return;
  }

  // Client-side filter
  if (category === 'all') {
    renderCards(allPlaces);
    return;
  }

  const filtered = allPlaces.filter(place =>
    (place.category || '').split('.')[0] === category
  );

  if (filtered.length === 0) {
    // Re-fetch from API with this specific category
    await fetchAndRenderPlaces(currentDest.lat, currentDest.lon, category);
  } else {
    renderCards(filtered);
  }
}

/* ══════════════════════════════════════════
   SAVE / ITINERARY
══════════════════════════════════════════ */

function handleCardSave(place) {
  const nowSaved = toggleSave(place);
  // Update all cards with this ID
  cardGrid.querySelectorAll(`[data-id="${place.id}"]`).forEach(card => {
    updateCardSaveState(card, nowSaved);
  });
  // Update modal if open on same place
  const current = getCurrentPlace();
  if (current?.id === place.id) updateSaveButton(nowSaved);

  showToast(nowSaved ? `✓ Saved "${truncate(place.name, 25)}"` : `Removed "${truncate(place.name, 25)}"`, 'success');
}

function handleCardClick(place) {
  openPlaceModal(place, isSaved(place.id));
}

function handleSaveFromModal(place) {
  handleCardSave(place);
}

/** Called by itinerary when an item is removed from the drawer */
function handleSaveStateChange(id, savedState) {
  cardGrid.querySelectorAll(`[data-id="${id}"]`).forEach(card => {
    updateCardSaveState(card, savedState);
  });
  const current = getCurrentPlace();
  if (current?.id === id) updateSaveButton(savedState);
}

/* ══════════════════════════════════════════
   SESSION RESTORE
══════════════════════════════════════════ */

function restoreSession() {
  const lastDest = get(KEYS.LAST_DEST, null);
  if (lastDest?.lat && lastDest?.lon) {
    currentDest = lastDest;
    setDestination(lastDest.lat, lastDest.lon, lastDest.formatted || lastDest.name);
    updateSEO(lastDest.formatted || lastDest.name);
    showDestinationUI(lastDest.formatted || lastDest.name);
    searchInput.value = lastDest.formatted || lastDest.name;

    const savedCategory = get(KEYS.ACTIVE_FILTERS, 'all');
    fetchAndRenderPlaces(lastDest.lat, lastDest.lon, savedCategory);
  }
}

/* ══════════════════════════════════════════
   API KEY WARNING
══════════════════════════════════════════ */

function showApiWarning() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:fixed; bottom:0; left:0; right:0;
    background:#1e293b; color:#fff;
    padding:12px 24px; font-family:var(--font-mono); font-size:13px;
    z-index:9999; display:flex; gap:16px; align-items:center; flex-wrap:wrap;
    border-top: 2px solid #D97706;
  `;
  banner.innerHTML = `
    <span>⚠️ <strong>API keys not configured.</strong> Open <code>config.js</code> and add your Geoapify and Unsplash keys to enable search.</span>
    <button onclick="this.parentElement.remove()" style="margin-left:auto;background:#D97706;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;font-family:inherit">Dismiss</button>
  `;
  document.body.appendChild(banner);
}

/* ══════════════════════════════════════════
   TINY HELPERS
══════════════════════════════════════════ */

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

/* ══════════════════════════════════════════
   START
══════════════════════════════════════════ */
boot();
