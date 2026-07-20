/**
 * Visualization record shape — see CONTRACT.md.
 * @typedef {Object} Visualization
 * @property {string} id
 * @property {string} label
 * @property {string} category
 * @property {number} value          normalized float in [0, 1]
 * @property {[number, number, number]} vector  3-tuple of normalized floats
 * @property {string} updatedAt      ISO-8601
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string} name
 */

/** Connection status for the live data stream. */
export const ConnectionStatus = Object.freeze({
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  DEMO: 'demo',
  ERROR: 'error',
})