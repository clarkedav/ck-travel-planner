/**
 * @module components/toast
 * @description Lightweight toast notification system.
 */

const container = document.getElementById('toast-container');

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='success']
 * @param {number} [duration=2800] ms before auto-dismiss
 */
export function showToast(message, type = 'success', duration = 2800) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');

  container.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}
