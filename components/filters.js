/**
 * @module components/filters
 * @description Manages the filter chip bar.
 * Handles toggle state and dispatches a custom 'filters:change' event.
 */

import { get, set, KEYS } from '../services/storage.js';

const chipsContainer = document.getElementById('filter-chips');
let activeCategory = 'all';
let onChangeCallback = null;

/**
 * Initialise the filter bar.
 * Restores last active filter from storage.
 * @param {function(string): void} onChange - Called with the active category key when changed
 */
export function initFilters(onChange) {
  onChangeCallback = onChange;

  // Restore from storage
  const saved = get(KEYS.ACTIVE_FILTERS, 'all');
  setActive(saved, false);

  chipsContainer.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    const category = chip.dataset.category;
    if (!category || category === activeCategory) return;

    setActive(category, true);
    set(KEYS.ACTIVE_FILTERS, category);
    if (onChangeCallback) onChangeCallback(category);
  });
}

/**
 * Get the currently active category.
 * @returns {string}
 */
export function getActiveCategory() {
  return activeCategory;
}

/**
 * Programmatically set a filter (does NOT trigger onChange callback).
 * @param {string} category
 */
export function setActiveCategory(category) {
  setActive(category, false);
}

/* ── Private ── */

function setActive(category, animate) {
  activeCategory = category;

  const chips = chipsContainer.querySelectorAll('.chip');
  chips.forEach(chip => {
    const isActive = chip.dataset.category === category;

    // Remove then re-add to retrigger animation
    chip.classList.remove('chip--active');
    chip.setAttribute('aria-pressed', 'false');

    if (isActive) {
      if (animate) {
        void chip.offsetWidth; // force reflow
      }
      chip.classList.add('chip--active');
      chip.setAttribute('aria-pressed', 'true');
    }
  });
}
