import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, Stars } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]} position={[0, 0, 0]}>
      <meshPhongMaterial
        color="#1a1a1a"
        emissive="#00ffff"
        emissiveIntensity={0.2}
        wireframe={true}
        wireframeLinewidth={0.5}
      />
    </Sphere>
  );
}

function FloatingCoin({ position, speed }: { position: [number, number, number]; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.elapsedTime * speed;
      meshRef.current.rotation.y = clock.elapsedTime * speed * 0.7;
      meshRef.current.position.y += Math.sin(clock.elapsedTime * speed) * 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
      <meshStandardMaterial
        color="#ffff00"
        emissive="#ff6600"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }

    return positions;
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.x = clock.elapsedTime * 0.0001;
      particlesRef.current.rotation.y = clock.elapsedTime * 0.0002;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00ffff" sizeAttenuation={true} />
    </points>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 75 }}
      style={{ width: "100%", height: "100%" }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ffff" />

      <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade={true} />

      <RotatingGlobe />

      <FloatingCoin position={[4, 2, 0]} speed={1} />
      <FloatingCoin position={[-4, -2, 0]} speed={0.8} />
      <FloatingCoin position={[2, -3, 2]} speed={1.2} />
      <FloatingCoin position={[-3, 3, -2]} speed={0.9} />

      <ParticleField />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={2}
      />
    </Canvas>
  );
}
