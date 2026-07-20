import { useStore } from '../state/store.js'
import { ConnectionStatus } from '../types.js'

const STATUS_LABEL = {
  [ConnectionStatus.IDLE]: 'Idle',
  [ConnectionStatus.CONNECTING]: 'Connecting…',
  [ConnectionStatus.CONNECTED]: 'Connected',
  [ConnectionStatus.AUTHENTICATED]: 'Authenticated',
  [ConnectionStatus.DEMO]: 'Demo data',
  [ConnectionStatus.ERROR]: 'Error',
}

export function TopBar() {
  const user = useStore((s) => s.user)
  const connectionStatus = useStore((s) => s.connectionStatus)
  const updateCount = useStore((s) => s.updateCount)
  const logout = useStore((s) => s.logout)

  const dotClass =
    connectionStatus === ConnectionStatus.AUTHENTICATED ||
    connectionStatus === ConnectionStatus.CONNECTED
      ? 'status-dot status-dot--online status-dot--live'
      : connectionStatus === ConnectionStatus.DEMO
        ? 'status-dot status-dot--warn'
        : connectionStatus === ConnectionStatus.ERROR
          ? 'status-dot status-dot--error'
          : 'status-dot'

  return (
    <header className="app-topbar">
      <div className="app-topbar__brand">
        <span className="app-topbar__brand-mark" aria-hidden="true" />
        <span>Orbital</span>
        <span style={{ color: 'var(--text-quaternary)', marginLeft: 8, fontWeight: 400 }}>
          3D Data Surface
        </span>
      </div>

      <div className="app-topbar__status" aria-live="polite">
        <span className={dotClass} />
        <span>{STATUS_LABEL[connectionStatus] ?? connectionStatus}</span>
        <span style={{ color: 'var(--text-quaternary)' }}>·</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {updateCount.toLocaleString()} updates
        </span>
      </div>

      <div className="app-topbar__user">
        {user && (
          <>
            <div className="app-topbar__avatar" aria-hidden="true">
              {initials(user.name)}
            </div>
            <span>{user.name}</span>
            <button className="btn btn--ghost btn--small" onClick={logout}>
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  )
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?'
}