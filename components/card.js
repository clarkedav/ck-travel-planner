/**
 * @module components/card
 * @description Renders a single place card DOM element from a place data object.
 * Emits custom events for card click and save toggle.
 */

import { truncateText, buildStarRating, formatCategory } from '../utils/helpers.js';
import { formatCategory as apiFormatCategory } from '../api/places.js';
import { mapCategory as apiFormatCategory } from '../api/places.js';

/**
 * Create a place card element.
 * @param {object} place - Normalised place object
 * @param {boolean} isSaved - Whether this place is in the itinerary
 * @returns {HTMLElement}
 */
export function createCard(place, isSaved = false) {
  const article = document.createElement('article');
  article.className    = 'place-card';
  article.dataset.id   = place.id;
  article.dataset.category = (place.category || '').split('.')[0];
  article.setAttribute('role', 'listitem');
  article.setAttribute('tabindex', '0');
  article.setAttribute('aria-label', `${place.name}. ${apiFormatCategory(place.category)}`);

  const { html: ratingHtml, label: ratingLabel } = buildStarRating(place.rating);
  const categoryLabel = apiFormatCategory(place.category);

  article.innerHTML = `
    <div class="place-card__photo-wrap">
      ${place.photoUrl
        ? `<img
             class="place-card__photo"
             src="${escHtml(place.photoUrl)}"
             alt="${escHtml(place.name)} photo"
             loading="lazy"
             width="400"
             height="250"
           />`
        : `<div class="place-card__photo-placeholder" aria-hidden="true">${categoryIcon(place.category)}</div>`
      }
      <span class="place-card__category-badge" aria-hidden="true">${escHtml(categoryLabel)}</span>
      <button
        class="place-card__save-btn${isSaved ? ' saved' : ''}"
        data-id="${escHtml(place.id)}"
        aria-label="${isSaved ? 'Remove from itinerary' : 'Save to itinerary'}: ${escHtml(place.name)}"
        aria-pressed="${isSaved}"
        title="${isSaved ? 'Remove from itinerary' : 'Save to itinerary'}"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>

    <div class="place-card__body">
      <h3 class="place-card__title">${escHtml(truncateText(place.name, 55))}</h3>
      ${place.address
        ? `<p class="place-card__address">${escHtml(truncateText(place.address, 70))}</p>`
        : ''}
      <div class="place-card__footer">
        ${ratingHtml
          ? `<span class="place-card__rating" aria-label="${ratingLabel}">${ratingHtml}</span>`
          : `<span class="place-card__rating" style="color:var(--color-text-muted);font-size:0.75rem">No rating</span>`
        }
      </div>
    </div>
  `;

  // ── Click on card body → open detail modal ──
  article.addEventListener('click', e => {
    if (e.target.closest('.place-card__save-btn')) return; // handled separately
    article.dispatchEvent(new CustomEvent('card:click', {
      bubbles: true,
      detail: { place },
    }));
  });

  article.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.place-card__save-btn')) {
      e.preventDefault();
      article.dispatchEvent(new CustomEvent('card:click', {
        bubbles: true,
        detail: { place },
      }));
    }
  });

  // ── Save button ──
  const saveBtn = article.querySelector('.place-card__save-btn');
  saveBtn.addEventListener('click', e => {
    e.stopPropagation();
    article.dispatchEvent(new CustomEvent('card:save', {
      bubbles: true,
      detail: { place },
    }));
  });

  return article;
}

/**
 * Update the saved state of a card without re-rendering it.
 * @param {HTMLElement} card
 * @param {boolean} isSaved
 */
export function updateCardSaveState(card, isSaved) {
  const btn = card.querySelector('.place-card__save-btn');
  if (!btn) return;
  btn.classList.toggle('saved', isSaved);
  btn.setAttribute('aria-pressed', String(isSaved));
  const svg = btn.querySelector('svg');
  if (svg) svg.setAttribute('fill', isSaved ? 'currentColor' : 'none');
  const name = card.querySelector('.place-card__title')?.textContent || '';
  btn.setAttribute('aria-label', `${isSaved ? 'Remove from' : 'Save to'} itinerary: ${name}`);
}

/** Render skeleton placeholder cards */
export function createSkeletonCards(count = 8) {
  return Array.from({ length: count }, () => {
    const el = document.createElement('div');
    el.className = 'skeleton-card';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="skeleton-photo"></div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-line skeleton-line--xshort"></div>
      </div>
    `;
    return el;
  });
}

/* ── Private helpers ── */

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Return a category emoji for a photo placeholder.
 * @param {string} category
 * @returns {string}
 */
function categoryIcon(category = '') {
  const c = (category || '').split('.')[0];
  return { catering:'🍽', tourism:'🏛', leisure:'🌿', entertainment:'🎭', commercial:'🛍', accommodation:'🏨' }[c] || '📍';
}
