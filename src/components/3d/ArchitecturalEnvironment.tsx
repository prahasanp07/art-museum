'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

export interface ArchitecturalEnvironmentProps {
  templateId?: string;
  customAmbientColor?: string;
  glbUrl?: string;
}

/**
 * Procedural Brutalist Atrium environment:
 * High industrial ceilings (6.0m), monolithic fluted concrete pillars,
 * structural ceiling cross-beams, and responsive MeshStandardMaterials.
 */
function BrutalistAtriumProcedural() {
  // Define pillar positions placed strictly between artwork bays to avoid occluding any slots
  // Slot Z coordinates: slot-01 (z=0), slot-02 (z=-6), slot-03 (z=-14.8), slot-04 (z=-14), slot-05 (z=-20), slot-06 (z=-27.8)
  const pillarPositions: [number, number, number][] = useMemo(
    () => [
      [-4.4, 3.0, 8.0],
      [4.4, 3.0, 8.0],
      [-4.4, 3.0, -3.0],
      [4.4, 3.0, -3.0],
      [-4.4, 3.0, -9.5],
      [4.4, 3.0, -9.5],
      [-4.4, 3.0, -17.0],
      [4.4, 3.0, -17.0],
      [-4.4, 3.0, -24.0],
      [4.4, 3.0, -24.0],
    ],
    []
  );

  // Define overhead industrial ceiling cross-beams aligned with the pillar colonnades
  const beamZPositions = useMemo(() => [8, -3, -9.5, -17, -24], []);

  return (
    <group name="brutalist-atrium-environment">
      {/* 1. Monolithic Concrete Floor (MeshStandardMaterial responsive to ambient light) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -10]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[22, 64]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.75}
          metalness={0.1}
          name="GalleryFloor"
        />
      </mesh>

      {/* 2. High Industrial Vaulted Ceiling (6.0m clearance) */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 6.0, -10]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[22, 64]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* 3. Overhead Structural Concrete Cross-Beams */}
      {beamZPositions.map((z) => (
        <mesh
          key={`beam-${z}`}
          position={[0, 5.7, z]}
          castShadow={false}
          receiveShadow={false}
        >
          <boxGeometry args={[12, 0.6, 0.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.15} />
        </mesh>
      ))}

      {/* 4. Monolithic Structural Concrete Pillars framing each bay */}
      {pillarPositions.map(([x, y, z], i) => (
        <group key={`pillar-${i}`} position={[x, y, z]}>
          {/* Main pillar column */}
          <mesh castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.7, 6.0, 0.7]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.8}
              metalness={0.15}
            />
          </mesh>
          {/* Pillar capital / plinth detail */}
          <mesh position={[0, 2.88, 0]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.95, 0.24, 0.95]} />
            <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh position={[0, -2.88, 0]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.95, 0.24, 0.95]} />
            <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* 5. Architectural Walls (Thickness = 0.2 matching slot mounting coordinates at x = ±4.9) */}
      {/* East Gallery Wall */}
      <mesh position={[5.0, 3.0, -10]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.2, 6.0, 64]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.8}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      {/* West Gallery Wall */}
      <mesh position={[-5.0, 3.0, -10]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.2, 6.0, 64]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.8}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      {/* North Masterpiece Wall */}
      <mesh position={[0, 3.0, -28.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[10.2, 6.0, 0.2]} />
        <meshStandardMaterial
          color="#151d2c"
          roughness={0.85}
          metalness={0.15}
          name="GalleryWall"
        />
      </mesh>

      {/* South Entrance Wall */}
      <mesh position={[0, 3.0, 15.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[10.2, 6.0, 0.2]} />
        <meshStandardMaterial
          color="#151d2c"
          roughness={0.85}
          metalness={0.15}
          name="GalleryWall"
        />
      </mesh>

      {/* Central Division Baffle backing slot-03 at z = -14.8 */}
      <mesh position={[0, 3.0, -15.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[4.2, 5.0, 0.2]} />
        <meshStandardMaterial
          color="#243044"
          roughness={0.75}
          metalness={0.2}
          name="GalleryWall"
        />
      </mesh>
    </group>
  );
}

/**
 * Procedural Minimalist Cube environment:
 * Refined dark obsidian gallery walls and sleek polished concrete floor.
 */
function MinimalistCubeProcedural() {
  return (
    <group name="minimalist-cube-environment">
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -10]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[20, 60]} />
        <meshStandardMaterial
          color="#161e2e"
          roughness={0.4}
          metalness={0.2}
          name="GalleryFloor"
        />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 4.0, -10]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[20, 60]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* East Wall */}
      <mesh position={[5.0, 2.0, -10]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.2, 4.0, 60]} />
        <meshStandardMaterial
          color="#1a2234"
          roughness={0.7}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      {/* West Wall */}
      <mesh position={[-5.0, 2.0, -10]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.2, 4.0, 60]} />
        <meshStandardMaterial
          color="#1a2234"
          roughness={0.7}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      {/* North End Wall */}
      <mesh position={[0, 2.0, -28.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[10.2, 4.0, 0.2]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.8}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      {/* South Entrance Wall */}
      <mesh position={[0, 2.0, 15.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[10.2, 4.0, 0.2]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.8}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      {/* Central Division Baffle */}
      <mesh position={[0, 2.0, -10.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[4.0, 4.0, 0.2]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.65}
          metalness={0.2}
          name="GalleryWall"
        />
      </mesh>
    </group>
  );
}

/**
 * Procedural Solarium Rotunda environment:
 * Luminous warm atmosphere with simulated overhead skylights.
 */
function SolariumRotundaProcedural() {
  return (
    <group name="solarium-rotunda-environment">
      {/* Floor: Polished warm terrazzo stone */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -10]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[20, 60]} />
        <meshStandardMaterial
          color="#26334d"
          roughness={0.35}
          metalness={0.25}
          name="GalleryFloor"
        />
      </mesh>

      {/* Ceiling with simulated glass skylight grids */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 5.0, -10]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[20, 60]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Walls: Soft gallery white/stone */}
      <mesh position={[5.0, 2.5, -10]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.2, 5.0, 60]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.65}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      <mesh position={[-5.0, 2.5, -10]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.2, 5.0, 60]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.65}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      {/* North & South Walls */}
      <mesh position={[0, 2.5, -28.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[10.2, 5.0, 0.2]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.7}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      <mesh position={[0, 2.5, 15.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[10.2, 5.0, 0.2]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.7}
          metalness={0.1}
          name="GalleryWall"
        />
      </mesh>

      {/* Central Division Baffle backing slot-03 */}
      <mesh position={[0, 2.5, -15.0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[4.0, 4.5, 0.2]} />
        <meshStandardMaterial
          color="#26334d"
          roughness={0.6}
          metalness={0.15}
          name="GalleryWall"
        />
      </mesh>
    </group>
  );
}

function renderProceduralEnvironment(templateId: string) {
  switch (templateId) {
    case 'brutalist-atrium-v1':
      return <BrutalistAtriumProcedural />;
    case 'solarium-rotunda-v1':
    case 'solarium-v1':
      return <SolariumRotundaProcedural />;
    case 'minimalist-cube-v1':
    default:
      return <MinimalistCubeProcedural />;
  }
}

/**
 * Custom GLB model loader with safe error handling that never crashes Suspense or Turbopack
 */
function RemoteEnvironmentLoader({
  glbUrl,
  templateId,
}: {
  glbUrl: string;
  templateId: string;
}) {
  const [loadedScene, setLoadedScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let active = true;
    const loader = new GLTFLoader();

    loader.load(
      glbUrl,
      (gltf) => {
        if (!active) return;
        setLoadedScene(gltf.scene);
      },
      undefined,
      (err) => {
        console.warn(
          `Environment GLB "${glbUrl}" not found or failed to load. Falling back to procedural ${templateId} environment.`,
          err
        );
      }
    );

    return () => {
      active = false;
    };
  }, [glbUrl, templateId]);

  if (loadedScene) {
    return <primitive object={loadedScene} castShadow={false} receiveShadow={false} />;
  }

  return renderProceduralEnvironment(templateId);
}

/**
 * ArchitecturalEnvironment:
 * - Dynamically loads architectural environment for template_id (brutalist-atrium-v1, minimalist-cube-v1, solarium-v1).
 * - Conforms to MeshStandardMaterial with high visual fidelity and lighting responsiveness.
 * - Safely handles missing or unhosted GLB files with zero crashes or Turbopack runtime errors.
 */
export function ArchitecturalEnvironment({
  templateId = 'minimalist-cube-v1',
  glbUrl,
}: ArchitecturalEnvironmentProps) {
  if (glbUrl) {
    return <RemoteEnvironmentLoader glbUrl={glbUrl} templateId={templateId} />;
  }

  return renderProceduralEnvironment(templateId);
}

export default ArchitecturalEnvironment;
