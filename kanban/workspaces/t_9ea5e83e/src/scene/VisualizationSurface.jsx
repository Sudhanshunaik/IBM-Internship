import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { PrimaryMesh } from './PrimaryMesh.jsx'
import { DataNodes } from './DataNodes.jsx'
import { useStore, selectItemsArray } from '../state/store.js'

/**
 * Root 3D surface. Captures mouse movement into normalized device coords and
 * feeds it down to <PrimaryMesh/> along with the latest received stream value.
 */
export function VisualizationSurface() {
  const items = useStore(selectItemsArray)
  const lastUpdate = useStore((s) => s.lastUpdate)
  const pulseValue = lastUpdate?.value ?? 0
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['#08090a']} />

      <Suspense fallback={null}>
        {/* Star field — quietly fills the negative space. */}
        <Stars
          radius={45}
          depth={32}
          count={1400}
          factor={2.2}
          saturation={0}
          fade
          speed={0.4}
        />

        {/* Lighting — low-key ambient + a soft key light from above-left. */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 2]} intensity={0.9} color="#d0d6e0" />
        <pointLight position={[-4, -2, -3]} intensity={0.4} color="#5e6ad2" />

        <PrimaryMesh mouse={mouse} pulseValue={pulseValue} />
        <DataNodes items={items} />
      </Suspense>
    </Canvas>
  )
}