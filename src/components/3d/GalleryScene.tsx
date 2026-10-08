'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GALLERY_SLOT_CONFIGS } from '@/lib/mockData';
import { ArchitecturalEnvironment } from './ArchitecturalEnvironment';
import { GallerySlot } from './GallerySlot';
import { InteriorManager } from './InteriorManager';
import { WayfindingPath } from './WayfindingPath';
import { GalleryWithArtworks, Profile } from '@/lib/types';

interface GallerySceneProps {
  gallery: GalleryWithArtworks;
  profile?: Profile | null;
}

/**
 * Instanced ceiling track lights to adhere strictly to Rule 02:
 * "Identical structural items must utilize <instancedMesh> ... under 200 draw calls"
 */
function InstancedTrackLights() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Define track light positions along the corridor length
  const lightPositions: [number, number, number][] = useMemo(
    () => [
      [0, 3.8, 10],
      [0, 3.8, 5],
      [2.5, 3.8, 0],
      [2.5, 3.8, -6],
      [0, 3.8, -10],
      [-2.5, 3.8, -14],
      [-2.5, 3.8, -20],
      [0, 3.8, -26],
    ],
    []
  );

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    lightPositions.forEach((pos, i) => {
      dummy.position.set(pos[0], pos[1], pos[2]);
      dummy.scale.set(1.2, 0.08, 0.15);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [lightPositions]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, lightPositions.length]}
      castShadow={false}
      receiveShadow={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#334155" />
    </instancedMesh>
  );
}

/**
 * GalleryScene renders the physical 3D museum corridor structure and mounted artwork slots.
 * Fully compliant with 02-performance-mandates.md:
 * - Zero dynamic shadow casting or receiving
 * - MeshBasicMaterial for architectural surfaces
 * - Instanced track lights
 * - Capped draw calls well below mobile budget (< 50 calls)
 */
export function GalleryScene({ gallery, profile }: GallerySceneProps) {
  // Map gallery slots to their corresponding artworks
  const slotsWithArtworks = useMemo(() => {
    return GALLERY_SLOT_CONFIGS.map((config) => {
      const match = gallery.slots.find((s) => s.slot_identifier === config.identifier);
      return {
        config,
        artwork: match?.artwork ?? null,
      };
    });
  }, [gallery]);

  return (
    <group>
      {/* 0. Canvas Clear Background */}
      <color attach="background" args={['#070a13']} />

      {/* 1. Global Responsive Lighting Architecture */}
      <hemisphereLight
        args={[gallery.custom_ambient_light_hex || '#e2e8f0', '#0f172a', 0.8]}
      />
      <directionalLight position={[10, 20, 15]} intensity={1.2} castShadow={false} />
      <directionalLight position={[-10, 15, -15]} intensity={0.6} castShadow={false} />

      {/* 2. Dynamic Architectural Environment: GLB loading with procedural template fallback */}
      <ArchitecturalEnvironment
        templateId={gallery.template_id}
        customAmbientColor={gallery.custom_ambient_light_hex}
      />

      {/* 3. Subtle floor grid line accents for spatial depth perception */}
      <gridHelper
        args={[60, 30, '#334155', '#1e293b']}
        position={[0, 0.01, -10]}
      />

      {/* 5. Instanced Track Lighting System */}
      <InstancedTrackLights />

      {/* 6. Dynamic Interior Manager: custom KTX2 textures & activated furniture props */}
      <InteriorManager gallery={gallery} />

      {/* 7. Dynamic Wayfinding Path: 20 floor chevrons pulsing with staggered GSAP tween */}
      <WayfindingPath />

      {/* 8. Mounted Artwork Slots */}
      {slotsWithArtworks.map(({ config, artwork }) => (
        <GallerySlot
          key={config.identifier}
          config={config}
          artwork={artwork}
          interiorConfig={gallery?.interior_config}
        />
      ))}
    </group>
  );
}

export default GalleryScene;

