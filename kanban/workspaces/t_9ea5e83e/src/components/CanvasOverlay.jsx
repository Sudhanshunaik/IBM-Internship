import { useStore, selectItemsArray } from '../state/store.js'
import { ConnectionStatus } from '../types.js'

/**
 * Overlay HUD on top of the 3D canvas. Shows aggregate metrics and transient
 * toasts. Pure presentation — all data comes from the store.
 */
export function CanvasOverlay() {
  const items = useStore(selectItemsArray)
  const connectionStatus = useStore((s) => s.connectionStatus)
  const updateCount = useStore((s) => s.updateCount)
  const lastUpdate = useStore((s) => s.lastUpdate)
  const toasts = useStore((s) => s.toasts)
  const loadVisualizations = useStore((s) => s.loadVisualizations)

  const avgValue =
    items.length > 0
      ? items.reduce((acc, it) => acc + (it.value ?? 0), 0) / items.length
      : 0

  const categories = new Set(items.map((it) => it.category).filter(Boolean)).size

  return (
    <>
      {connectionStatus === ConnectionStatus.DEMO && (
        <div className="banner" role="status">
          ⚠ Backend unreachable — running in demo mode
        </div>
      )}

      <div className="canvas-hud">
        <div className="canvas-hud__top-left">
          <div style={{ display: 'flex', gap: 8 }}>
            <MetricCard
              label="Records"
              value={items.length.toString()}
              hint="in viewport"
            />
            <MetricCard
              label="Avg value"
              value={avgValue.toFixed(2)}
              hint={`${categories} categories`}
            />
            <MetricCard
              label="Updates"
              value={updateCount.toLocaleString()}
              hint={lastUpdate ? `latest @ ${formatTime(lastUpdate.updatedAt)}` : 'no data yet'}
              delta={
                lastUpdate?.value != null
                  ? `${(lastUpdate.value * 100).toFixed(0)}%`
                  : null
              }
            />
          </div>
        </div>

        <div className="canvas-hud__bottom-right">
          <button
            className="btn btn--ghost btn--small"
            onClick={loadVisualizations}
            title="Re-fetch from REST"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="toast-stack">
        {toasts.map((t) => (
          <div className="toast" key={t.id} role="status">
            <span>{iconFor(t.kind)}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function MetricCard({ label, value, hint, delta }) {
  const deltaClass =
    delta && delta.startsWith('-')
      ? 'metric-card__delta--down'
      : delta
        ? 'metric-card__delta--up'
        : ''
  return (
    <div className="metric-card">
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      {delta && <div className={`metric-card__delta ${deltaClass}`}>{delta}</div>}
      {hint && !delta && <div className="metric-card__delta">{hint}</div>}
    </div>
  )
}

function iconFor(kind) {
  if (kind === 'error') return '✕'
  if (kind === 'warn') return '⚠'
  return '•'
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return ''
  }
}