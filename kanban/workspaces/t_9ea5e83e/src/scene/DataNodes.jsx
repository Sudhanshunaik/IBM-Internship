import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Renders one floating node per visualization record. Each node's position is
 * driven by the record's `vector`; its size and color come from `value`.
 *
 * The node list re-renders cheaply: positions are written into per-node
 * instance refs on each frame from a stable Float32Array so React doesn't
 * reconcile 80 meshes every tick.
 */
const MAX_NODES = 80
const ORBIT_RADIUS = 2.4

function valueToColor(value, accent) {
  // Mix between a dim gray and the accent by value.
  const v = THREE.MathUtils.clamp(value ?? 0, 0, 1)
  const dim = new THREE.Color('#3a3d44')
  const hot = new THREE.Color(accent)
  return dim.clone().lerp(hot, v)
}

export function DataNodes({ items, accent = '#7170ff' }) {
  // Slice to MAX_NODES — newest first because Map iteration is insertion order.
  const list = useMemo(() => {
    const arr = Array.from(items.values())
    return arr.slice(-MAX_NODES)
  }, [items])

  const groupRef = useRef()
  const meshRefs = useRef([])

  // Reset ref array length when list changes.
  meshRefs.current.length = list.length

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const g = groupRef.current
    if (g) g.rotation.y += delta * 0.04

    for (let i = 0; i < list.length; i++) {
      const node = meshRefs.current[i]
      if (!node) continue
      const rec = list[i]
      const [vx = 0, vy = 0, vz = 0] = rec.vector ?? [0, 0, 0]
      const r = ORBIT_RADIUS
      // Apply a gentle phase offset per record so they don't all move in lockstep.
      const phase = i * 0.37 + (rec.id ? hashCode(rec.id) * 0.0001 : 0)
      const wobble = 0.08 * Math.sin(t * 0.8 + phase)
      node.position.set(
        vx * r + wobble,
        vy * r + Math.cos(t * 0.5 + phase) * 0.04,
        vz * r + wobble * 0.5
      )
      const scale = 0.05 + (rec.value ?? 0) * 0.13
      node.scale.setScalar(scale)
      const m = node.material
      if (m && 'emissiveIntensity' in m) {
        m.emissiveIntensity = 0.5 + (rec.value ?? 0) * 1.6
      }
    }
  })

  return (
    <group ref={groupRef}>
      {list.map((rec, i) => (
        <mesh
          key={rec.id}
          ref={(el) => (meshRefs.current[i] = el)}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={valueToColor(rec.value, accent)}
            emissive={valueToColor(rec.value, accent)}
            emissiveIntensity={0.6}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  )
}

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return h
}