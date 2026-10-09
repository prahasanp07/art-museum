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
 * Track lighting height dynamically mounts to the ceiling of each architectural template.
 */
function InstancedTrackLights({ templateId }: { templateId?: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const trackY = useMemo(() => {
    if (templateId === 'brutalist-atrium-v1') return 5.65;
    if (templateId === 'solarium-rotunda-v1' || templateId === 'solarium-v1') return 5.15;
    return 3.85;
  }, [templateId]);

  // Define track light positions along the corridor length
  const lightPositions: [number, number, number][] = useMemo(
    () => [
      [0, trackY, 10],
      [0, trackY, 5],
      [2.5, trackY, 0],
      [2.5, trackY, -6],
      [0, trackY, -10],
      [-2.5, trackY, -14],
      [-2.5, trackY, -20],
      [0, trackY, -26],
    ],
    [trackY]
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
      <meshBasicMaterial color="#475569" />
    </instancedMesh>
  );
}

/**
 * GalleryScene renders the physical 3D museum corridor structure and mounted artwork slots.
 * Fully compliant with 02-performance-mandates.md:
 * - Zero dynamic shadow casting or receiving
 * - Instanced track lights adapting to ceiling height
 * - Capped draw calls well below mobile budget (< 50 calls)
 */
export function GalleryScene({ gallery, profile }: GallerySceneProps) {
  // Map gallery slots to their corresponding artworks and frame overrides
  const slotsWithArtworks = useMemo(() => {
    return GALLERY_SLOT_CONFIGS.map((config) => {
      const match = gallery.slots.find((s) => s.slot_identifier === config.identifier);
      const frameGlbId =
        match?.frame_glb_id ||
        gallery?.interior_config?.frames?.find(
          (f: any) =>
            f.slot_identifier === config.identifier ||
            (match?.artwork?.id && f.artwork_id === match.artwork.id)
        )?.frame_glb_id;

      const frameDesignId =
        match?.frame_design_id ||
        gallery?.interior_config?.frames?.find(
          (f: any) =>
            f.slot_identifier === config.identifier ||
            (match?.artwork?.id && f.artwork_id === match.artwork.id)
        )?.frame_design_id;

      return {
        config,
        artwork: match?.artwork ?? null,
        frameGlbId,
        frameDesignId,
      };
    });
  }, [gallery]);

  const isSolarium =
    gallery.template_id === 'solarium-rotunda-v1' || gallery.template_id === 'solarium-v1';
  const isBrutalist = gallery.template_id === 'brutalist-atrium-v1';

  const skyColor = isSolarium
    ? '#fef3c7'
    : gallery.custom_ambient_light_hex || '#e2e8f0';
  const ambientIntensity = isSolarium ? 1.05 : isBrutalist ? 0.75 : 0.85;

  return (
    <group>
      {/* 0. Canvas Clear Background */}
      <color attach="background" args={[isSolarium ? '#0b1120' : '#070a13']} />

      {/* 1. Global Responsive Lighting Architecture */}
      <hemisphereLight
        args={[skyColor, isSolarium ? '#1e293b' : '#0f172a', ambientIntensity]}
      />
      <directionalLight
        position={isBrutalist ? [12, 26, 18] : [10, 20, 15]}
        intensity={isSolarium ? 1.35 : isBrutalist ? 1.3 : 1.15}
        color={isSolarium ? '#fffbeb' : '#ffffff'}
        castShadow={false}
      />
      <directionalLight
        position={[-10, 15, -15]}
        intensity={isSolarium ? 0.75 : 0.55}
        color={isSolarium ? '#fed7aa' : '#ffffff'}
        castShadow={false}
      />

      {/* 2. Dynamic Architectural Environment: GLB loading with procedural template fallback */}
      <ArchitecturalEnvironment
        templateId={gallery.template_id}
        customAmbientColor={gallery.custom_ambient_light_hex}
      />

      {/* 4. Instanced Track Lighting System mounted to architectural ceiling */}
      <InstancedTrackLights templateId={gallery.template_id} />

      {/* 6. Dynamic Interior Manager: custom KTX2 textures & activated furniture props */}
      <InteriorManager gallery={gallery} />

      {/* 7. Dynamic Wayfinding Path: 20 floor chevrons pulsing with staggered GSAP tween */}
      <WayfindingPath />

      {/* 8. Mounted Artwork Slots */}
      {slotsWithArtworks.map(({ config, artwork, frameGlbId, frameDesignId }) => (
        <GallerySlot
          key={config.identifier}
          config={config}
          artwork={artwork}
          frameGlbId={frameGlbId}
          frameDesignId={frameDesignId}
          interiorConfig={gallery?.interior_config}
        />
      ))}
    </group>
  );
}

export default GalleryScene;

