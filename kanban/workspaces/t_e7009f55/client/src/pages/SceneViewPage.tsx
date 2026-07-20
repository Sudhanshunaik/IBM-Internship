import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { Scene, DataPoint } from '@mern-3dviz/shared';
import { sceneApi } from '../api/client';
import { useSceneFeed } from '../hooks/useSceneFeed';
import { useSceneFeedStore } from '../store/sceneFeed';
import { PointCloud } from '../scene/PointCloud';

export function SceneViewPage() {
  const { id } = useParams<{ id: string }>();
  const [scene, setScene] = useState<Scene | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    sceneApi.get(id).then(({ scene }) => setScene(scene)).catch((e) => setError(String(e)));
  }, [id]);

  // Hook up the live feed; cleans itself up on unmount.
  useSceneFeed(scene?._id ?? null);

  const pointCount = useSceneFeedStore((s) => s.points.length);
  const lastReceivedAt = useSceneFeedStore((s) => s.lastReceivedAt);

  if (error) return <div style={{ padding: 24 }}>Failed to load scene: {error}</div>;
  if (!scene) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div className="canvas-wrap">
      <Canvas camera={{ position: scene.camera.position, fov: scene.camera.fov }} dpr={[1, 2]}>
        <color attach="background" args={['#060912']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.7} />
        <Grid args={[20, 20]} cellColor="#1f2a44" sectionColor="#3a4a7a" />
        <PointCloud />
        <OrbitControls target={scene.camera.target} makeDefault />
      </Canvas>
      <div className="hud">
        <div><strong>{scene.title}</strong></div>
        <div><span className="label">points: </span>{pointCount}</div>
        <div><span className="label">last update: </span>{lastReceivedAt ? new Date(lastReceivedAt).toLocaleTimeString() : '—'}</div>
        <div><span className="label">data sources: </span>{scene.dataSourceIds.length}</div>
      </div>
    </div>
  );
}

// Re-export DataPoint for type-only imports
export type { DataPoint };