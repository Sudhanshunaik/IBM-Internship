import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Page, Scene } from '@mern-3dviz/shared';
import { sceneApi } from '../api/client';

export function SceneListPage() {
  const [page, setPage] = useState<Page<Scene> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sceneApi.list({ page: 1, pageSize: 24 }).then(setPage).catch((e) => setError(String(e)));
  }, []);

  if (error) return <div style={{ padding: 24 }}>Failed to load scenes: {error}</div>;
  if (!page) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div className="list">
      {page.items.map((scene) => (
        <Link to={`/scenes/${scene._id}`} key={scene._id} className="card" style={{ display: 'block' }}>
          <h3>{scene.title}</h3>
          <div className="meta">{scene.isPublic ? 'public' : 'private'} · updated {new Date(scene.updatedAt).toLocaleString()}</div>
        </Link>
      ))}
      {page.items.length === 0 && <div style={{ color: 'var(--muted)' }}>No scenes yet.</div>}
    </div>
  );
}