/**
 * @module components/modal
 * @description Manages the place detail modal: open, close, populate.
 * Traps focus and handles keyboard navigation per ARIA authoring practices.
 */

import { openModal, closeModal } from '../services/animation.js';
import { buildStarRating, formatHours } from '../utils/helpers.js';
import { formatCategory } from '../api/places.js';

const backdrop = document.getElementById('modal-backdrop');
const panel    = document.getElementById('modal-panel');
const closeBtn = document.getElementById('modal-close-btn');
const saveBtn  = document.getElementById('modal-save-btn');

let currentPlace  = null;
let onSaveCallback = null;
let lastFocused   = null;

/** Initialise modal event listeners. Call once on app boot. */
export function initModal(onSave) {
  onSaveCallback = onSave;

  // Close button
  closeBtn.addEventListener('click', close);

  // Save button
  saveBtn.addEventListener('click', () => {
    if (currentPlace && onSaveCallback) {
      onSaveCallback(currentPlace);
    }
  });

  // Click outside panel to close
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) close();
  });

  // Keyboard: Escape to close, Tab trap
  document.addEventListener('keydown', handleKeydown);
}

/**
 * Open the modal and populate it with a place's data.
 * @param {object} place - Normalised place object
 * @param {boolean} isSaved - Current saved state
 */
export function openPlaceModal(place, isSaved) {
  currentPlace  = place;
  lastFocused   = document.activeElement;

  populate(place);
  updateSaveButton(isSaved);

  openModal(backdrop, panel);
}

/**
 * Update the modal's save button state without re-opening.
 * @param {boolean} isSaved
 */
export function updateSaveButton(isSaved) {
  if (!saveBtn) return;
  saveBtn.setAttribute('aria-pressed', String(isSaved));
  saveBtn.innerHTML = isSaved
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved!`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save to Itinerary`;
  saveBtn.classList.toggle('saved', isSaved);
}

/** Close the modal. */
export function close() {
  closeModal(backdrop, lastFocused);
  currentPlace = null;
}

/** @returns {object|null} Currently displayed place */
export function getCurrentPlace() {
  return currentPlace;
}

/* ── Private ── */

function populate(place) {
  // Photo
  const photo = document.getElementById('modal-photo');
  if (place.photoUrl) {
    photo.src = place.photoUrl;
    photo.alt = `${place.name} photo`;
    document.getElementById('modal-photo-wrap').hidden = false;
  } else {
    document.getElementById('modal-photo-wrap').hidden = true;
  }

  // Category & rating
  document.getElementById('modal-category').textContent = formatCategory(place.category);

  const { html: ratingHtml, label: ratingLabel } = buildStarRating(place.rating);
  const ratingEl = document.getElementById('modal-rating');
  ratingEl.innerHTML = ratingHtml || '';
  ratingEl.setAttribute('aria-label', ratingLabel);

  // Title & address
  document.getElementById('modal-title').textContent   = place.name;
  document.getElementById('modal-address').textContent = place.address || '';

  // Hours
  const hoursRow = document.getElementById('modal-hours-row');
  if (place.hours) {
    document.getElementById('modal-hours').textContent = formatHours(place.hours);
    hoursRow.hidden = false;
  } else {
    hoursRow.hidden = true;
  }

  // Phone
  const phoneRow = document.getElementById('modal-phone-row');
  if (place.phone) {
    const phoneLink = document.getElementById('modal-phone');
    phoneLink.textContent = place.phone;
    phoneLink.href        = `tel:${place.phone}`;
    phoneRow.hidden       = false;
  } else {
    phoneRow.hidden = true;
  }

  // Website
  const websiteRow = document.getElementById('modal-website-row');
  if (place.website) {
    const websiteLink = document.getElementById('modal-website');
    websiteLink.href = place.website;
    websiteLink.textContent = new URL(place.website).hostname.replace('www.', '');
    websiteRow.hidden = false;
  } else {
    websiteRow.hidden = true;
  }

  // Google Maps link
  const mapsLink = document.getElementById('modal-maps-link');
  mapsLink.href = place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}

function handleKeydown(e) {
  if (backdrop.hidden) return;

  if (e.key === 'Escape') {
    close();
    return;
  }

  if (e.key === 'Tab') {
    trapFocus(e);
  }
}

function trapFocus(e) {
  const focusable = Array.from(
    panel.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.disabled && el.offsetParent !== null);

  if (!focusable.length) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
