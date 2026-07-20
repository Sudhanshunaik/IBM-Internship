import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { ConnectionStatus } from '../types.js'
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '../config.js'
import {
  loginRequest,
  registerRequest,
  fetchMe,
  fetchVisualizations,
} from '../api/client.js'
import { createLiveStream } from '../api/socket.js'

/* -------------------------------------------------------------------------- */
/* Persistence helpers                                                        */
/* -------------------------------------------------------------------------- */

const loadPersisted = () => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const userJson = localStorage.getItem(USER_STORAGE_KEY)
    const user = userJson ? JSON.parse(userJson) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

const persist = (token, user) => {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
  else localStorage.removeItem(TOKEN_STORAGE_KEY)
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_STORAGE_KEY)
}

/* -------------------------------------------------------------------------- */
/* Toast queue (transient UI messages)                                        */
/* -------------------------------------------------------------------------- */

const MAX_TOASTS = 4
const TOAST_TTL_MS = 3200

let toastSeq = 0

/* -------------------------------------------------------------------------- */
/* Viz item helpers                                                           */
/* -------------------------------------------------------------------------- */

const MAX_ITEMS = 80 // ring buffer cap; older records decay out
const upsertItem = (map, item) => {
  if (!item || typeof item.id !== 'string') return map
  const next = new Map(map)
  next.set(item.id, item)
  // Cap the map size: drop oldest by updatedAt.
  if (next.size > MAX_ITEMS) {
    const sorted = [...next.entries()].sort(
      (a, b) =>
        new Date(a[1].updatedAt ?? 0).getTime() -
        new Date(b[1].updatedAt ?? 0).getTime()
    )
    const dropCount = next.size - MAX_ITEMS
    for (let i = 0; i < dropCount; i++) next.delete(sorted[i][0])
  }
  return next
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

const initial = loadPersisted()

export const useStore = create(
  subscribeWithSelector((set, get) => ({
    /* ----- auth ----- */
    user: initial.user,
    token: initial.token,
    authStatus: initial.token ? 'restoring' : 'idle',
    authError: null,

    /* ----- connection ----- */
    connectionStatus: ConnectionStatus.IDLE,
    connectionMessage: null,
    demoMode: false,

    /* ----- data ----- */
    items: new Map(), // id -> Visualization
    lastUpdate: null, // most recent record received
    updateCount: 0,

    /* ----- ui ----- */
    toasts: [],

    /* =====================================================================
       Auth actions
       ===================================================================== */

    async login(email, password) {
      set({ authStatus: 'submitting', authError: null })
      try {
        const { user, token } = await loginRequest(email, password)
        persist(token, user)
        set({ user, token, authStatus: 'authenticated', authError: null })
        get().startStream()
        return { ok: true }
      } catch (err) {
        const message =
          err.response?.data?.message ?? err.message ?? 'Login failed'
        set({ authStatus: 'idle', authError: message })
        return { ok: false, error: message }
      }
    },

    async register(email, password, name) {
      set({ authStatus: 'submitting', authError: null })
      try {
        const { user, token } = await registerRequest(email, password, name)
        persist(token, user)
        set({ user, token, authStatus: 'authenticated', authError: null })
        get().startStream()
        return { ok: true }
      } catch (err) {
        const message =
          err.response?.data?.message ?? err.message ?? 'Registration failed'
        set({ authStatus: 'idle', authError: message })
        return { ok: false, error: message }
      }
    },

    async restoreSession() {
      const { token, user } = get()
      if (!token) {
        set({ authStatus: 'idle' })
        return
      }
      try {
        const me = await fetchMe()
        const fresh = { id: me.id, email: me.email, name: me.name }
        persist(token, fresh)
        set({ user: fresh, authStatus: 'authenticated' })
        get().startStream()
      } catch (err) {
        if (err.isAuthError) {
          persist(null, null)
          set({ user: null, token: null, authStatus: 'idle' })
        } else {
          // Network failure: stay logged in optimistically, start stream in demo if needed.
          set({ authStatus: 'authenticated' })
          get().startStream()
        }
      }
    },

    logout() {
      get().stopStream()
      persist(null, null)
      set({
        user: null,
        token: null,
        authStatus: 'idle',
        items: new Map(),
        lastUpdate: null,
        updateCount: 0,
        connectionStatus: ConnectionStatus.IDLE,
        demoMode: false,
      })
    },

    /* =====================================================================
       Domain data
       ===================================================================== */

    async loadVisualizations() {
      try {
        const items = await fetchVisualizations()
        let map = new Map()
        for (const it of items) map = upsertItem(map, it)
        set({ items: map })
      } catch (err) {
        if (err.isAuthError) {
          get().logout()
          return
        }
        get().pushToast({
          kind: 'warn',
          message: `Could not load data: ${err.message}`,
        })
      }
    },

    /* =====================================================================
       Real-time stream
       ===================================================================== */

    _stream: null,

    startStream() {
      const existing = get()._stream
      if (existing) return
      const { token } = get()

      let map = new Map()
      const stream = createLiveStream({
        onStatus: ({ label, message, socketId }) => {
          set({
            connectionStatus: label,
            connectionMessage: message ?? null,
            demoMode: label === ConnectionStatus.DEMO,
          })
          if (label === ConnectionStatus.DEMO) {
            get().pushToast({
              kind: 'warn',
              message: 'Live channel offline — demo data only',
            })
          }
          if (label === ConnectionStatus.AUTHENTICATED) {
            get().pushToast({ kind: 'info', message: 'Live channel authenticated' })
          }
        },
        onSnapshot: (items) => {
          map = new Map()
          for (const it of items) map = upsertItem(map, it)
          set({ items: map, updateCount: get().updateCount })
        },
        onUpdate: (item) => {
          map = upsertItem(map, item)
          set({
            items: map,
            lastUpdate: item,
            updateCount: get().updateCount + 1,
          })
        },
        onError: (payload) => {
          get().pushToast({
            kind: 'error',
            message: `Auth rejected: ${payload?.message ?? 'unknown'}`,
          })
        },
      })
      stream.connect(token)
      set({ _stream: stream })
    },

    stopStream() {
      const s = get()._stream
      if (s) {
        s.disconnect()
        set({ _stream: null, connectionStatus: ConnectionStatus.IDLE, demoMode: false })
      }
    },

    /* =====================================================================
       Toasts
       ===================================================================== */

    pushToast(toast) {
      const id = ++toastSeq
      const t = { id, kind: 'info', ...toast }
      set({ toasts: [...get().toasts, t].slice(-MAX_TOASTS) })
      setTimeout(() => {
        set({ toasts: get().toasts.filter((x) => x.id !== id) })
      }, TOAST_TTL_MS)
    },

    dismissToast(id) {
      set({ toasts: get().toasts.filter((x) => x.id !== id) })
    },
  }))
)

/* -------------------------------------------------------------------------- */
/* Selectors (stable references for components)                               */
/* -------------------------------------------------------------------------- */

export const selectItemsArray = (state) => Array.from(state.items.values())
export const selectIsAuthed = (state) =>
  state.authStatus === 'authenticated' && !!state.user && !!state.token