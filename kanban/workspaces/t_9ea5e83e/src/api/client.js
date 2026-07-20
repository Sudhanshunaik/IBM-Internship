import axios from 'axios'
import { config, TOKEN_STORAGE_KEY } from '../config.js'

/**
 * Axios instance with JWT interceptor. Pulls the token from localStorage on
 * every request so a logout in another tab takes effect on the next call.
 */
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((req) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    req.headers.Authorization = `Bearer ${token}`
  }
  return req
})

apiClient.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err.response?.status === 401) {
      // Surface a custom flag so the store can route to /login.
      err.isAuthError = true
    }
    return Promise.reject(err)
  }
)

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export async function loginRequest(email, password) {
  const { data } = await apiClient.post('/api/auth/login', { email, password })
  return data // { user, token }
}

export async function registerRequest(email, password, name) {
  const { data } = await apiClient.post('/api/auth/register', { email, password, name })
  return data
}

export async function fetchMe() {
  const { data } = await apiClient.get('/api/auth/me')
  return data
}

/* -------------------------------------------------------------------------- */
/* Domain data                                                                */
/* -------------------------------------------------------------------------- */

export async function fetchVisualizations() {
  const { data } = await apiClient.get('/api/visualizations')
  return data.items ?? []
}

export async function fetchHealth() {
  const { data } = await apiClient.get('/health')
  return data
}