import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

/** Glowing data ring orbiting the orb */
function OrbitalRing({ radius, speed, color, tilt }: { radius: number; speed: number; color: string; tilt: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.z = clock.getElapsedTime() * speed;
  });
  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.015, 16, 100]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.6} />
    </mesh>
  );
}

/** Floating dots simulating data particles */
function DataParticles({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#67e8f9" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

/** Core orb scene */
function OrbScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#67e8f9" />
      <pointLight position={[-5, -3, 3]} intensity={0.6} color="#a78bfa" />

      {/* Main orb */}
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#0e1a3a"
            emissive="#22d3ee"
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.8}
            distort={0.25}
            speed={2}
          />
        </mesh>
      </Float>

      {/* Orbital rings */}
      <OrbitalRing radius={1.5} speed={0.3} color="#22d3ee" tilt={1.2} />
      <OrbitalRing radius={1.8} speed={-0.2} color="#8b5cf6" tilt={0.6} />
      <OrbitalRing radius={2.1} speed={0.15} color="#06b6d4" tilt={-0.9} />

      <DataParticles />
    </>
  );
}

export function FinanceOrb() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <OrbScene />
      </Canvas>
    </div>
  );
}
