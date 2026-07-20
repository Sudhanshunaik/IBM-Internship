import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A primary interactive mesh: a cluster of nested icosahedrons that rotates
 * slowly on its own, accelerates toward the mouse position, and pulses with
 * the latest received data value.
 *
 * Props:
 *   mouse       – { x, y } in normalized device coords [-1, 1]
 *   pulseValue  – most recent 0..1 value from the live stream
 *   accent      – CSS color string for the highlight ring
 *   dim         – CSS color string for the dim inner shell
 */
export function PrimaryMesh({ mouse, pulseValue, accent = '#7170ff', dim = '#5e6ad2' }) {
  const group = useRef()
  const inner = useRef()
  const outer = useRef()
  const ring = useRef()

  const targetRotation = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    // Spring-eased rotation toward the mouse.
    targetRotation.current.x += (mouse.y * 0.6 - targetRotation.current.x) * 0.05
    targetRotation.current.y += (mouse.x * 0.8 - targetRotation.current.y) * 0.05

    g.rotation.x +=
      (targetRotation.current.x - g.rotation.x) * 0.08 +
      delta * 0.08
    g.rotation.y +=
      (targetRotation.current.y - g.rotation.y) * 0.08 +
      delta * 0.12

    // Pulse: scale and emissive intensity follow the latest stream value.
    const pulse = 0.92 + (pulseValue ?? 0) * 0.32
    g.scale.setScalar(pulse)

    if (inner.current) {
      inner.current.rotation.x -= delta * 0.5
      inner.current.rotation.y -= delta * 0.3
    }
    if (outer.current) {
      outer.current.rotation.x += delta * 0.2
      outer.current.rotation.z += delta * 0.15
    }
    if (ring.current) {
      ring.current.rotation.z += delta * 0.4
      const m = ring.current.material
      if (m && 'emissiveIntensity' in m) {
        m.emissiveIntensity = 0.4 + (pulseValue ?? 0) * 1.4
      }
    }
  })

  const accentColor = useMemo(() => new THREE.Color(accent), [accent])
  const dimColor = useMemo(() => new THREE.Color(dim), [dim])

  return (
    <group ref={group}>
      {/* Inner shell — wireframe icosahedron */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial
          color={dimColor}
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Outer shell — solid icosahedron, slightly larger, additive */}
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.45}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {/* Highlight ring — responds to pulse */}
      <mesh ref={ring}>
        <torusGeometry args={[1.45, 0.012, 12, 96]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  )
}