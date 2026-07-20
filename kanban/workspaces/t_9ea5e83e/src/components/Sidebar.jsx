import { useMemo } from 'react'
import { useStore } from '../state/store.js'

/**
 * Side panel listing the visualization records currently in state, grouped by
 * category. Updated automatically as the live stream pushes new records.
 */
export function Sidebar() {
  const items = useStore((s) => s.items)
  const lastUpdate = useStore((s) => s.lastUpdate)

  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of items.values()) {
      const cat = item.category ?? 'uncategorized'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat).push(item)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  return (
    <aside className="app-sidebar">
      <div className="side-section">
        <div className="side-section__label">Live stream</div>
        <div className="side-list">
          <div className="side-item">
            <span className="side-item__swatch" />
            <span className="side-item__name">Total records</span>
            <span className="side-item__value">{items.size}</span>
          </div>
          <div className="side-item">
            <span className="side-item__swatch" />
            <span className="side-item__name">Last update</span>
            <span className="side-item__value">
              {lastUpdate ? formatTime(lastUpdate.updatedAt) : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="side-section">
        <div className="side-section__label">Categories</div>
        {grouped.length === 0 ? (
          <div className="side-empty">Waiting for data…</div>
        ) : (
          grouped.map(([cat, list]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 510,
                  color: 'var(--text-tertiary)',
                  padding: '4px 8px',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                {cat}
              </div>
              <div className="side-list">
                {list.slice(-6).reverse().map((item) => (
                  <div key={item.id} className="side-item">
                    <span className="side-item__swatch" />
                    <span className="side-item__name">{item.label}</span>
                    <span className="side-item__value">
                      {item.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '—'
  }
}