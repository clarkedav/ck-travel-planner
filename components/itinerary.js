/**
 * @module components/itinerary
 * @description Manages the slide-out itinerary drawer.
 * Handles rendering saved places, drag-and-drop reordering (desktop + touch),
 * removal of items, and syncing to localStorage.
 */

import { get, set, KEYS } from '../services/storage.js';
import { openDrawer, closeDrawer } from '../services/animation.js';
import { truncateText } from '../utils/helpers.js';
import { formatCategory } from '../api/places.js';

const drawer       = document.getElementById('itinerary-drawer');
const overlay      = document.getElementById('drawer-overlay');
const list         = document.getElementById('itinerary-list');
const emptyState   = document.getElementById('itinerary-empty');
const badge        = document.getElementById('itinerary-badge');
const toggleBtn    = document.getElementById('itinerary-toggle-btn');
const closeBtn     = document.getElementById('itinerary-close-btn');
const clearBtn     = document.getElementById('clear-itinerary-btn');

/** @type {Array<object>} In-memory copy of itinerary */
let items = [];

/** @type {function(string, boolean): void} Called when save state changes */
let onSaveChange = null;

// Drag-and-drop state
let dragSrcIndex = -1;
let touchStartY  = 0;
let touchItem    = null;

/* ══════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════ */

/**
 * Initialise the itinerary component.
 * @param {function(placeId: string, isSaved: boolean): void} onSaveChangeCallback
 */
export function initItinerary(onSaveChangeCallback) {
  onSaveChange = onSaveChangeCallback;

  // Load persisted data
  items = get(KEYS.ITINERARY, []);

  render();
  updateBadge();

  // Drawer open/close
  toggleBtn.addEventListener('click', () => openDrawer(drawer, overlay));
  closeBtn.addEventListener('click',  () => closeDrawer(drawer, overlay));
  overlay.addEventListener('click',   () => closeDrawer(drawer, overlay));

  // Clear all
  clearBtn.addEventListener('click', () => {
    if (!items.length) return;
    if (!confirm('Remove all saved places?')) return;
    const ids = items.map(p => p.id);
    items = [];
    persist();
    render();
    updateBadge();
    ids.forEach(id => onSaveChange?.(id, false));
  });

  // Escape key closes drawer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer(drawer, overlay);
    }
  });
}

/**
 * Add a place to the itinerary (if not already present).
 * @param {object} place
 * @returns {boolean} true if added, false if already present
 */
export function addPlace(place) {
  if (items.find(p => p.id === place.id)) return false;
  items.push({
    id:       place.id,
    name:     place.name,
    category: place.category,
    address:  place.address,
    rating:   place.rating,
    photoUrl: place.photoUrl,
    lat:      place.lat,
    lon:      place.lon,
  });
  persist();
  render();
  updateBadge();
  return true;
}

/**
 * Remove a place from the itinerary by ID.
 * @param {string} id
 * @returns {boolean} true if removed
 */
export function removePlace(id) {
  const before = items.length;
  items = items.filter(p => p.id !== id);
  if (items.length === before) return false;
  persist();
  render();
  updateBadge();
  return true;
}

/**
 * Check whether a place is currently saved.
 * @param {string} id
 * @returns {boolean}
 */
export function isSaved(id) {
  return items.some(p => p.id === id);
}

/**
 * Toggle saved state for a place.
 * @param {object} place
 * @returns {boolean} New saved state
 */
export function toggleSave(place) {
  if (isSaved(place.id)) {
    removePlace(place.id);
    return false;
  } else {
    addPlace(place);
    return true;
  }
}

/**
 * Return a shallow copy of the current itinerary.
 * @returns {Array<object>}
 */
export function getItems() {
  return [...items];
}

/* ══════════════════════════════════════════
   PRIVATE — RENDER
══════════════════════════════════════════ */

function render() {
  list.innerHTML = '';
  emptyState.hidden = items.length > 0;

  items.forEach((place, index) => {
    const li = createItem(place, index);
    list.appendChild(li);
  });
}

function createItem(place, index) {
  const li = document.createElement('li');
  li.className         = 'itinerary-item';
  li.dataset.id        = place.id;
  li.dataset.index     = index;
  li.draggable         = true;
  li.setAttribute('role', 'listitem');
  li.setAttribute('aria-label', place.name);

  li.innerHTML = `
    <span class="itinerary-item__drag-handle" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/>
        <circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
        <circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
      </svg>
    </span>
    ${place.photoUrl
      ? `<img class="itinerary-item__photo" src="${esc(place.photoUrl)}" alt="" loading="lazy" />`
      : `<div class="itinerary-item__photo" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--color-teal-50)" aria-hidden="true">${catIcon(place.category)}</div>`
    }
    <div class="itinerary-item__info">
      <p class="itinerary-item__name">${esc(truncateText(place.name, 30))}</p>
      <p class="itinerary-item__category">${esc(formatCategory(place.category))}</p>
    </div>
    <button
      class="itinerary-item__remove"
      data-id="${esc(place.id)}"
      aria-label="Remove ${esc(place.name)} from itinerary"
      title="Remove"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  // Remove button
  li.querySelector('.itinerary-item__remove').addEventListener('click', e => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    removePlace(id);
    onSaveChange?.(id, false);
  });

  // ── Desktop drag-and-drop ──
  li.addEventListener('dragstart', onDragStart);
  li.addEventListener('dragover',  onDragOver);
  li.addEventListener('dragleave', onDragLeave);
  li.addEventListener('drop',      onDrop);
  li.addEventListener('dragend',   onDragEnd);

  // ── Touch drag-and-drop ──
  li.addEventListener('touchstart', onTouchStart, { passive: true });
  li.addEventListener('touchmove',  onTouchMove,  { passive: false });
  li.addEventListener('touchend',   onTouchEnd);

  return li;
}

function updateBadge() {
  const count = items.length;
  badge.textContent = count;
  badge.hidden = count === 0;
  toggleBtn.setAttribute('aria-label', `Itinerary (${count} saved place${count !== 1 ? 's' : ''})`);
}

function persist() {
  set(KEYS.ITINERARY, items);
}

/* ══════════════════════════════════════════
   PRIVATE — DESKTOP DRAG & DROP
══════════════════════════════════════════ */

function onDragStart(e) {
  dragSrcIndex = Number(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcIndex);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const destIndex = Number(e.currentTarget.dataset.index);
  e.currentTarget.classList.remove('drag-over');
  if (dragSrcIndex === destIndex) return;
  reorder(dragSrcIndex, destIndex);
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging', 'drag-over');
  list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  dragSrcIndex = -1;
}

/* ══════════════════════════════════════════
   PRIVATE — TOUCH DRAG & DROP
══════════════════════════════════════════ */

function onTouchStart(e) {
  touchItem   = e.currentTarget;
  touchStartY = e.touches[0].clientY;
  touchItem.classList.add('dragging');
}

function onTouchMove(e) {
  if (!touchItem) return;
  e.preventDefault();

  const y        = e.touches[0].clientY;
  const items_   = Array.from(list.querySelectorAll('.itinerary-item'));
  const target   = items_.find(item => {
    const rect = item.getBoundingClientRect();
    return y >= rect.top && y <= rect.bottom && item !== touchItem;
  });

  list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  if (target) target.classList.add('drag-over');
}

function onTouchEnd(e) {
  if (!touchItem) return;

  const y      = e.changedTouches[0].clientY;
  const items_ = Array.from(list.querySelectorAll('.itinerary-item'));
  const target = items_.find(item => {
    const rect = item.getBoundingClientRect();
    return y >= rect.top && y <= rect.bottom && item !== touchItem;
  });

  touchItem.classList.remove('dragging');
  list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

  if (target) {
    const srcIndex  = Number(touchItem.dataset.index);
    const destIndex = Number(target.dataset.index);
    if (srcIndex !== destIndex) reorder(srcIndex, destIndex);
  }

  touchItem   = null;
  touchStartY = 0;
}

/* ══════════════════════════════════════════
   PRIVATE — REORDER
══════════════════════════════════════════ */

function reorder(from, to) {
  const moved = items.splice(from, 1)[0];
  items.splice(to, 0, moved);
  persist();
  render();
}

/* ── Tiny helpers ── */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function catIcon(cat = '') {
  const c = cat.split('.')[0];
  return { catering:'🍽', tourism:'🏛', leisure:'🌿', entertainment:'🎭', commercial:'🛍', accommodation:'🏨' }[c] || '📍';
}
