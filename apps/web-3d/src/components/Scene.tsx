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
      <Rig speed={config.speed} />
    </Canvas>
  );
}
