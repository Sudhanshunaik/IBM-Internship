import { io } from 'socket.io-client'
import { config } from '../config.js'

/**
 * Thin wrapper around the Socket.IO client that:
 *  - Connects to the same origin as the REST API.
 *  - Surfaces a clean event API for the store (no socket objects leak out).
 *  - Falls back to a local "demo mode" emitter if the server is unreachable
 *    after several attempts — so the 3D scene stays alive during dev.
 */
export function createLiveStream({ onConnect, onAuthenticated, onError, onSnapshot, onUpdate, onStatus }) {
  let socket = null
  let demoTimer = null
  let attempts = 0
  let destroyed = false
  let demoMode = false

  const status = (label, extra) => onStatus?.({ label, ...extra })

  const startDemoMode = () => {
    if (destroyed || demoMode) return
    demoMode = true
    status('demo', { message: 'Backend unreachable — running in demo mode' })

    // Seed snapshot
    const seed = Array.from({ length: 8 }, (_, i) => makeDemoRecord(`seed-${i}`, i))
    setTimeout(() => onSnapshot?.(seed), 250)

    // Continuous updates
    const tick = () => {
      if (destroyed) return
      const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      onUpdate?.(makeDemoRecord(id, Math.random()))
      demoTimer = setTimeout(tick, 600 + Math.random() * 1200)
    }
    tick()
  }

  const connect = (token) => {
    if (destroyed) return
    status('connecting')
    socket = io(config.apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 4,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      timeout: 5000,
      auth: { token },
    })

    socket.on('connect', () => {
      attempts = 0
      onConnect?.(socket.id)
      status('connected', { socketId: socket.id })
      if (token) socket.emit('authenticate', { token })
      socket.emit('subscribe', { channel: 'visualizations' })
    })

    socket.on('authenticated', (payload) => {
      status('authenticated', payload)
      onAuthenticated?.(payload)
    })

    socket.on('auth_error', (payload) => {
      status('error', { message: payload?.message ?? 'auth failed' })
      onError?.(payload)
    })

    socket.on('visualization:snapshot', (payload) => {
      onSnapshot?.(payload?.items ?? [])
    })

    socket.on('visualization:update', (payload) => {
      if (payload && typeof payload === 'object') onUpdate?.(payload)
    })

    socket.on('connect_error', (err) => {
      attempts++
      if (attempts >= 4) {
        // Server unreachable — bail to demo mode.
        socket?.disconnect()
        socket = null
        startDemoMode()
      } else {
        status('error', { message: err?.message ?? 'connect failed' })
      }
    })

    socket.on('disconnect', (reason) => {
      status('idle', { reason })
      if (reason === 'io server disconnect') {
        socket?.connect()
      }
    })

    // Hard fallback: if we never see `connect` after 6s, switch to demo.
    setTimeout(() => {
      if (!socket?.connected && !demoMode && !destroyed) {
        socket?.disconnect()
        socket = null
        startDemoMode()
      }
    }, 6000)
  }

  const disconnect = () => {
    destroyed = true
    if (demoTimer) clearTimeout(demoTimer)
    socket?.disconnect()
    socket = null
  }

  return { connect, disconnect }
}

function makeDemoRecord(id, t) {
  const theta = t * Math.PI * 2
  const vector = [
    Math.sin(theta) * 0.9,
    Math.cos(theta * 1.3) * 0.7,
    Math.sin(theta * 0.7 + 1.1) * 0.8,
  ]
  const value = 0.5 + Math.sin(theta * 1.7) * 0.4
  const categories = ['alpha', 'beta', 'gamma', 'delta', 'epsilon']
  const category = categories[Math.floor(t * categories.length) % categories.length]
  return {
    id,
    label: `signal-${id.slice(-4)}`,
    category,
    value: clamp01(value),
    vector: vector.map((v) => clamp(v, -1, 1)),
    updatedAt: new Date().toISOString(),
  }
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}
function clamp01(v) {
  return clamp(v, 0, 1)
}