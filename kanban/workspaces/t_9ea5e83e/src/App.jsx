import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore, selectIsAuthed } from './state/store.js'
import { AuthScreen } from './components/AuthScreen.jsx'
import { TopBar } from './components/TopBar.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { CanvasOverlay } from './components/CanvasOverlay.jsx'
import { VisualizationSurface } from './scene/VisualizationSurface.jsx'

export default function App() {
  const authStatus = useStore((s) => s.authStatus)
  const isAuthed = useStore(selectIsAuthed)
  const restoreSession = useStore((s) => s.restoreSession)
  const loadVisualizations = useStore((s) => s.loadVisualizations)
  const items = useStore((s) => s.items)

  // On boot: try to restore a persisted session.
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Once authenticated, pull the initial snapshot from REST.
  useEffect(() => {
    if (isAuthed) loadVisualizations()
  }, [isAuthed, loadVisualizations])

  if (authStatus === 'restoring') {
    return <SplashScreen />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthed ? (
            <SurfaceShell />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          isAuthed ? <Navigate to="/" replace /> : <AuthScreen />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function SurfaceShell() {
  const items = useStore((s) => s.items)
  return (
    <div className="app-shell">
      <TopBar />
      <Sidebar />
      <main className="app-canvas">
        <VisualizationSurface />
        <CanvasOverlay />
        {items.size === 0 && (
          <div className="empty-state">
            <div className="empty-state__title">No live data yet</div>
            <div className="empty-state__body">
              The visualization will populate as soon as records stream in from
              the backend. Move your cursor to rotate the central mesh.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SplashScreen() {
  return (
    <div className="auth-shell">
      <div className="empty-state">
        <div className="empty-state__title">Restoring session…</div>
      </div>
    </div>
  )
}