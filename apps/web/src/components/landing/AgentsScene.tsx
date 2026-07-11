"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const AGENT_COUNT = 7;
const MESSAGE_COUNT = 4;
const AGENT_COLORS = ["#168a41", "#7a63f0", "#ee7226"];

function Agents() {
  const groupRef = useRef<THREE.Group>(null);
  const messagesRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const nodes = useMemo(
    () =>
      Array.from({ length: AGENT_COUNT }, (_, i) => {
        const angle = (i / AGENT_COUNT) * Math.PI * 2;
        const radius = 2.2 + (i % 3) * 0.3;
        return {
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle * 1.3) * 0.9,
            Math.sin(angle) * radius,
          ),
          phase: i * 0.9,
        };
      }),
    [],
  );

  const edges = useMemo(() => {
    const pairs: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      pairs.push([i, (i + 1) % nodes.length]);
      if (i % 2 === 0) pairs.push([i, (i + 2) % nodes.length]);
    }
    return pairs;
  }, [nodes]);

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      positions.set(nodes[a].position.toArray(), i * 6);
      positions.set(nodes[b].position.toArray(), i * 6 + 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [edges, nodes]);

  const messages = useMemo(
    () =>
      Array.from({ length: MESSAGE_COUNT }, (_, i) => ({
        edge: edges[(i * 3) % edges.length],
        offset: i / MESSAGE_COUNT,
        speed: 0.25 + (i % 3) * 0.08,
      })),
    [edges],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    groupRef.current?.children.forEach((child, i) => {
      const node = nodes[i];
      if (!node) return;
      const s = 1 + Math.sin(t * 1.4 + node.phase) * 0.18;
      child.scale.setScalar(s);
    });

    const mesh = messagesRef.current;
    if (mesh) {
      messages.forEach((m, i) => {
        const [a, b] = m.edge;
        const frac = (t * m.speed + m.offset) % 1;
        const pos = nodes[a].position.clone().lerp(nodes[b].position, frac);
        tempObject.position.copy(pos);
        tempObject.updateMatrix();
        mesh.setMatrixAt(i, tempObject.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#7a63f0" transparent opacity={0.35} />
      </lineSegments>
      <group ref={groupRef}>
        {nodes.map((node, i) => (
          <mesh key={i} position={node.position}>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial
              color={AGENT_COLORS[i % AGENT_COLORS.length]}
              emissive={AGENT_COLORS[i % AGENT_COLORS.length]}
              emissiveIntensity={0.6}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>
      <instancedMesh ref={messagesRef} args={[undefined, undefined, MESSAGE_COUNT]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </instancedMesh>
    </>
  );
}

/**
 * Trimmed, landing-specific copy of apps/web-3d's "agents" preset - two
 * consumers, duplication is the accepted answer here (see
 * apps/web-3d/src/app/globals.css's header comment for the same policy
 * applied to CSS).
 */
export function AgentsScene() {
  return (
    <Canvas
      camera={{ position: [0, 2.4, 7], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 6, 5]} intensity={200} color="#ffffff" />
      <pointLight position={[-6, -3, -4]} intensity={100} color="#7a63f0" />
      <Agents />
    </Canvas>
  );
}
