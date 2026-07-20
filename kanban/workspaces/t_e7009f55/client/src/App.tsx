import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SceneListPage } from './pages/SceneListPage';
import { SceneViewPage } from './pages/SceneViewPage';
import { useAuthStore } from './store/auth';

export function App() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">MERN 3D Viz</div>
        <nav className="nav">
          <Link to="/scenes">Scenes</Link>
        </nav>
        <div className="spacer" />
        {accessToken ? (
          <button onClick={() => useAuthStore.getState().logout()}>Sign out</button>
        ) : (
          <Link to="/login">Sign in</Link>
        )}
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/scenes" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scenes" element={<SceneListPage />} />
        <Route path="/scenes/:id" element={<SceneViewPage />} />
      </Routes>
    </div>
  );
}