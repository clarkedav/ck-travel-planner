/**
 * @module services/animation
 * @description Reusable animation utilities for UI transitions.
 */

/**
 * Stagger-animate a NodeList of card elements by re-triggering their
 * CSS animation (achieved by removing and re-adding the class that drives it).
 * @param {NodeList|Array<Element>} cards
 */
export function staggerCards(cards) {
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.05}s`;
    card.style.animationName  = 'none';
    // Force reflow
    void card.offsetWidth;
    card.style.animationName = '';
  });
}

/**
 * Open the modal backdrop with a scale-in animation.
 * Traps focus inside the modal panel.
 * @param {HTMLElement} backdrop
 * @param {HTMLElement} panel
 */
export function openModal(backdrop, panel) {
  backdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  // Focus first focusable element
  requestAnimationFrame(() => {
    const focusable = panel.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable || panel).focus();
  });
}

/**
 * Close the modal backdrop.
 * @param {HTMLElement} backdrop
 * @param {HTMLElement} [returnFocus] - Element to return focus to
 */
export function closeModal(backdrop, returnFocus) {
  backdrop.hidden = true;
  document.body.style.overflow = '';
  if (returnFocus) returnFocus.focus();
}

/**
 * Slide the itinerary drawer open.
 * @param {HTMLElement} drawer
 * @param {HTMLElement} overlay
 */
export function openDrawer(drawer, overlay) {
  drawer.hidden = false;
  overlay.hidden = false;
  // Allow display to take effect before adding class
  requestAnimationFrame(() => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = 'hidden';
}

/**
 * Slide the itinerary drawer closed.
 * @param {HTMLElement} drawer
 * @param {HTMLElement} overlay
 */
export function closeDrawer(drawer, overlay) {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    drawer.hidden = true;
    overlay.hidden = true;
  }, 350); // match --transition-slow
  document.body.style.overflow = '';
}
