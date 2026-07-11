"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneConfig } from "@/lib/scene-config";

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

function WaveField({ config }: { config: SceneConfig }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const grid = config.density;
  const count = grid * grid;

  const colors = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      tempColor.setHSL(
        (config.hue / 360 + (i / count) * 0.08) % 1,
        0.65,
        0.55 + ((i * 7919) % 100) / 1000,
      );
      tempColor.toArray(array, i * 3);
    }
    return array;
  }, [count, config.hue]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime * config.speed;
    let i = 0;
    for (let x = 0; x < grid; x++) {
      for (let z = 0; z < grid; z++) {
        const cx = (x - grid / 2 + 0.5) * 0.8;
        const cz = (z - grid / 2 + 0.5) * 0.8;
        const y = Math.sin(cx * 0.9 + t) * Math.cos(cz * 0.9 + t * 0.8) * 1.2;
        tempObject.position.set(cx, y, cz);
        const s = 0.28 + 0.1 * Math.sin(t + x + z);
        tempObject.scale.set(s, s + Math.abs(y) * 0.3, s);
        tempObject.rotation.set(0, t * 0.2 + (x + z) * 0.05, 0);
        tempObject.updateMatrix();
        mesh.setMatrixAt(i++, tempObject.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={count}
      ref={meshRef}
      args={[undefined, undefined, count]}
    >
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </boxGeometry>
      <meshStandardMaterial vertexColors roughness={0.35} metalness={0.25} />
    </instancedMesh>
  );
}

function Orbitals({ config }: { config: SceneConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const count = config.density;

  const bodies = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 1.4 + (i / count) * 3.2,
        tilt: (i / count) * Math.PI,
        phase: (i * 2.399963) % (Math.PI * 2), // golden angle spacing
        size: 0.12 + ((i * 31) % 10) / 45,
        hue: (config.hue / 360 + (i / count) * 0.12) % 1,
      })),
    [count, config.hue],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.elapsedTime * config.speed;
    group.children.forEach((child, i) => {
      const body = bodies[i];
      if (!body) return;
      const angle = t * (0.5 + (i % 5) * 0.12) + body.phase;
      const x = Math.cos(angle) * body.radius;
      const z = Math.sin(angle) * body.radius;
      const y = Math.sin(angle * 0.9 + body.tilt) * body.radius * 0.35;
      child.position.set(x, y, z);
    });
  });

  return (
    <group ref={groupRef}>
      {bodies.map((body, i) => (
        <mesh key={i}>
          <sphereGeometry args={[body.size, 24, 24]} />
          <meshStandardMaterial
            color={new THREE.Color().setHSL(body.hue, 0.7, 0.6)}
            emissive={new THREE.Color().setHSL(body.hue, 0.7, 0.25)}
            roughness={0.3}
          />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial
          color={new THREE.Color().setHSL(config.hue / 360, 0.75, 0.62)}
          emissive={new THREE.Color().setHSL(config.hue / 360, 0.8, 0.4)}
          emissiveIntensity={1.4}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function TorusKnot({ config }: { config: SceneConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime * config.speed;
    mesh.rotation.x = t * 0.35;
    mesh.rotation.y = t * 0.5;
  });

  // p/q derived from density so the model can meaningfully reshape the knot.
  const p = 2 + Math.floor(config.density / 8);
  const q = 3 + (config.density % 5);

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1.7, 0.45, 220, 36, p, q]} />
      <meshStandardMaterial
        color={new THREE.Color().setHSL(config.hue / 360, 0.7, 0.55)}
        emissive={new THREE.Color().setHSL(config.hue / 360, 0.8, 0.18)}
        roughness={0.25}
        metalness={0.5}
      />
    </mesh>
  );
}

function Agents({ config }: { config: SceneConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const messagesRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  // Density (6-24) maps down to a legible node count for a network - a
  // few agents read clearly, 24 individual spheres would just be noise.
  const count = Math.max(4, Math.min(10, Math.round(config.density / 2)));

  const nodes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const radius = 2.2 + (i % 3) * 0.3;
        return {
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle * 1.3) * 0.9,
            Math.sin(angle) * radius,
          ),
          phase: i * 0.9,
          hue: (config.hue / 360 + (i / count) * 0.14) % 1,
        };
      }),
    [count, config.hue],
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

  const messageCount = Math.min(6, edges.length);
  const messages = useMemo(
    () =>
      Array.from({ length: messageCount }, (_, i) => ({
        edge: edges[(i * 3) % edges.length],
        offset: i / messageCount,
        speed: 0.25 + (i % 3) * 0.08,
      })),
    [edges, messageCount],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * config.speed;

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
        <lineBasicMaterial
          color={new THREE.Color().setHSL(config.hue / 360, 0.6, 0.55)}
          transparent
          opacity={0.35}
        />
      </lineSegments>
      <group ref={groupRef}>
        {nodes.map((node, i) => (
          <mesh key={i} position={node.position}>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(node.hue, 0.7, 0.6)}
              emissive={new THREE.Color().setHSL(node.hue, 0.75, 0.3)}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>
      <instancedMesh key={messageCount} ref={messagesRef} args={[undefined, undefined, messageCount]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </instancedMesh>
    </>
  );
}

function Rig({ speed }: { speed: number }) {
  const rotation = useRef({ x: -0.35, y: 0, dragging: false, lastX: 0, lastY: 0 });

  useFrame(({ camera, clock, gl }) => {
    const state = rotation.current;
    if (!state.dragging) {
      state.y += 0.0016 * speed;
    }
    const r = 9;
    camera.position.set(
      Math.sin(state.y) * r * Math.cos(state.x),
      Math.sin(-state.x) * r,
      Math.cos(state.y) * r * Math.cos(state.x),
    );
    camera.lookAt(0, 0, 0);

    const canvas = gl.domElement;
    if (!canvas.dataset.rigBound) {
      canvas.dataset.rigBound = "1";
      canvas.style.touchAction = "none";
      canvas.addEventListener("pointerdown", (e) => {
        state.dragging = true;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
      });
      window.addEventListener("pointermove", (e) => {
        if (!state.dragging) return;
        state.y += (e.clientX - state.lastX) * 0.005;
        state.x = Math.min(
          1.2,
          Math.max(-1.2, state.x + (e.clientY - state.lastY) * 0.005),
        );
        state.lastX = e.clientX;
        state.lastY = e.clientY;
      });
      window.addEventListener("pointerup", () => {
        state.dragging = false;
      });
    }
  });

  return null;
}

export function Scene({ config }: { config: SceneConfig }) {
  return (
    <Canvas
      camera={{ position: [0, 3, 9], fov: 46 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 8, 6]} intensity={220} color="#ffffff" />
      <pointLight
        position={[-8, -4, -6]}
        intensity={120}
        color={new THREE.Color().setHSL(config.hue / 360, 0.8, 0.6)}
      />
      {config.preset === "waveField" && <WaveField config={config} />}
      {config.preset === "orbitals" && <Orbitals config={config} />}
      {config.preset === "torusKnot" && <TorusKnot config={config} />}
      {config.preset === "agents" && <Agents config={config} />}
      <Rig speed={config.speed} />
    </Canvas>
  );
}
