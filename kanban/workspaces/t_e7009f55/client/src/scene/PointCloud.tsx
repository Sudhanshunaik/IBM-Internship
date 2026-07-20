import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSceneFeedStore } from '../store/sceneFeed';

/**
 * Three.js point cloud that subscribes to the live feed store.
 * Re-builds the BufferGeometry when the point buffer changes;
 * animates a slow rotation so the visualization feels alive.
 */
export function PointCloud() {
  const points = useSceneFeedStore((s) => s.points);
  const meshRef = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      const v = typeof p.value === 'number' ? p.value : 0.5;
      colors[i * 3 + 0] = 0.2 + 0.8 * v;
      colors[i * 3 + 1] = 0.4 + 0.4 * (1 - v);
      colors[i * 3 + 2] = 0.9 - 0.4 * v;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [points]);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.1;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <bufferGeometry attach="geometry" {...(geometry as unknown as object)} />
      <pointsMaterial size={0.12} sizeAttenuation vertexColors />
    </points>
  );
}