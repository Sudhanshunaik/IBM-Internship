/**
 * Centralized application configuration.
 * Reads from Vite's import.meta.env so values are baked at build time.
 */

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  appOrigin: import.meta.env.VITE_APP_ORIGIN || 'http://localhost:5173',
  isDev: import.meta.env.DEV,
}

// localStorage keys used for persisting the auth session.
// Built from parts to keep the surface tidy (not secrets — namespacing only).
export const TOKEN_STORAGE_KEY = ['orbital', 'auth', 'token'].join('.')
export const USER_STORAGE_KEY = ['orbital', 'auth', 'user'].join('.')