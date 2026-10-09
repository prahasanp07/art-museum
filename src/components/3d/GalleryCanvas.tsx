'use client';

import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  KeyboardControls,
  type KeyboardControlsEntry,
} from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGalleryStore } from '@/store/useGalleryStore';
import { GalleryWithArtworks, Profile, GallerySlot, Artwork } from '@/lib/types';
import { CameraController } from './CameraController';
import { FreeRoamController } from './FreeRoamController';
import { GalleryScene } from './GalleryScene';
import { CreatorPlaque } from './CreatorPlaque';
import { ReticleOverlay } from './ReticleOverlay';
import { ArchitecturalEnvironment } from './ArchitecturalEnvironment';

// Register GSAP plugins safely on client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export type GalleryNavigationControls = 'forward' | 'backward' | 'left' | 'right';

/**
 * Keyboard controls mapping for both WASD and Arrow key navigation
 */
export const galleryKeyboardMap: KeyboardControlsEntry<GalleryNavigationControls>[] = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp', 'w', 'W'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown', 's', 'S'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft', 'a', 'A'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight', 'd', 'D'] },
];

export interface GalleryCanvasProps {
  gallery?: GalleryWithArtworks;
  profile?: Profile | null;
  custom_ambient_light_hex?: string;
  customAmbientLightHex?: string;
  template_id?: string;
  templateId?: string;
  slots?: (GallerySlot & { artwork: Artwork | null })[];
}

/**
 * Architectural Template Environment:
 * Fallback environment when gallery data is being loaded or rendered standalone.
 */
function ArchitecturalTemplate({
  customAmbientColor = '#ffffff',
  templateId = 'minimalist-cube-v1',
}: {
  customAmbientColor?: string;
  templateId?: string;
}) {
  return (
    <group>
      {/* 0. Canvas Clear Background */}
      <color attach="background" args={['#070a13']} />

      {/* 1. Global Responsive Lighting Architecture */}
      <hemisphereLight args={[customAmbientColor, '#0f172a', 0.8]} />
      <directionalLight position={[10, 20, 15]} intensity={1.2} castShadow={false} />
      <directionalLight position={[-10, 15, -15]} intensity={0.6} castShadow={false} />

      {/* 2. Architectural Environment */}
      <ArchitecturalEnvironment
        templateId={templateId}
        customAmbientColor={customAmbientColor}
      />

      {/* 3. Depth grid lines */}
      <gridHelper
        args={[60, 30, '#334155', '#1e293b']}
        position={[0, 0.01, -10]}
      />
    </group>
  );
}

/**
 * GalleryCanvas sets up the isolated React Three Fiber WebGL viewport.
 * - Standard shadows explicitly set to false (`shadows={false}`) to enforce baked lighting.
 * - Placeholder MeshBasicMaterial floor and walls represent the architectural template.
 * - Hidden `h-[500vh]` scroll bridge in the DOM layout uses GSAP ScrollTrigger to
 *   transiently update scrollProgress in useGalleryStore without triggering React re-renders.
 */
export function GalleryCanvas({
  gallery,
  profile,
  custom_ambient_light_hex: custom_ambient_light_hex_prop,
  customAmbientLightHex,
  template_id: template_id_prop,
  templateId,
  slots,
}: GalleryCanvasProps) {
  const scrollBridgeRef = useRef<HTMLDivElement>(null);
  const navigationMode = useGalleryStore((s) => s.navigationMode);
  const setNavigationMode = useGalleryStore((s) => s.setNavigationMode);

  // Derive parameters from props or fallback to hydrated gallery
  const custom_ambient_light_hex =
    custom_ambient_light_hex_prop ??
    customAmbientLightHex ??
    gallery?.custom_ambient_light_hex ??
    '#ffffff';

  const activeTemplateId =
    template_id_prop ??
    templateId ??
    gallery?.template_id ??
    'minimalist-cube-v1';

  const activeProfile = profile ?? gallery?.profile ?? null;
  const activeSlots = slots ?? gallery?.slots;

  // Scroll Bridge: Connect physical 500vh scroll track to Zustand transient state
  useEffect(() => {
    if (typeof window === 'undefined' || !scrollBridgeRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: scrollBridgeRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        // State Decoupling: Transient store update causes 0 React DOM re-renders
        useGalleryStore.getState().setScrollProgress(self.progress);
      },
    });

    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <>
      {/* 
        1. 3D Render Layer (React Three Fiber):
        Isolated fixed viewport (z-0) preventing DOM layout thrashing (01-project-overview.md)
      */}
      <div
        id="r3f-gallery-viewport"
        className="fixed inset-0 w-screen h-screen z-0 overflow-hidden bg-[#05070c]"
        data-testid="r3f-gallery-viewport"
      >
        {/* Navigation Mode Switcher Button (Layered over canvas at top right, z-10) */}
        <button
          type="button"
          onClick={() =>
            setNavigationMode(navigationMode === 'freeroam' ? 'scroll' : 'freeroam')
          }
          className="absolute top-6 right-6 z-10 pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-md bg-black/60 hover:bg-black/80 border border-white/20 text-white text-xs font-medium transition-all duration-200 shadow-xl hover:border-cyan-400/50 hover:shadow-cyan-500/20 active:scale-95 cursor-pointer"
          data-testid="toggle-navigation-mode"
          aria-label="Toggle navigation mode"
        >
          <span
            className={`w-2 h-2 rounded-full ${navigationMode === 'freeroam' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
              }`}
          />
          <span className="font-semibold tracking-wide">
            {navigationMode === 'freeroam' ? 'Free Roam' : 'Guided Tour'}
          </span>
          <span className="text-[10px] text-slate-400 border-l border-white/20 pl-2 hidden sm:inline">
            {navigationMode === 'freeroam' ? 'WASD / Click to Look' : 'Scroll to Tour'}
          </span>
        </button>

        {/* Central Aiming Reticle and Mode Status overlay */}
        <ReticleOverlay />

        {/* Wrap Canvas with KeyboardControls mapping WASD & Arrows */}
        <KeyboardControls map={galleryKeyboardMap}>
          <Canvas
            shadows={false}
            dpr={[1, Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1)]}
            camera={{
              fov: 55,
              near: 0.1,
              far: 100,
              position: [0, 1.7, 12],
            }}
            gl={{
              powerPreference: 'high-performance',
              antialias: true,
              alpha: false,
              stencil: false,
              depth: true,
            }}
          >
            {/* Dynamic Camera Navigation: Guided Tour vs Free Roam */}
            {navigationMode === 'freeroam' ? (
              <FreeRoamController />
            ) : (
              <CameraController />
            )}

            {/* Canvas Lighting: Bind custom_ambient_light_hex directly to R3F ambientLight */}
            <ambientLight color={custom_ambient_light_hex} intensity={1} />

            {/* Creator Entry Plaque Component on Left Entry Wall */}
            <CreatorPlaque
              position={[-4.88, 1.8, 2.5]}
              rotation={[0, Math.PI / 2, 0]}
              profile={activeProfile}
              display_name={activeProfile?.display_name ?? undefined}
              username={activeProfile?.username ?? undefined}
              bio={activeProfile?.bio ?? undefined}
              avatar_url={activeProfile?.avatar_url ?? undefined}
            />

            {/* Architectural template floor and walls */}
            {gallery ? (
              <GalleryScene
                gallery={{
                  ...gallery,
                  custom_ambient_light_hex,
                  template_id: activeTemplateId,
                  slots: activeSlots && activeSlots.length > 0 ? activeSlots : gallery.slots,
                }}
                profile={activeProfile}
              />
            ) : (
              <ArchitecturalTemplate
                customAmbientColor={custom_ambient_light_hex}
                templateId={activeTemplateId}
              />
            )}
          </Canvas>
        </KeyboardControls>
      </div>

      {/* 
        2. Hidden 500vh Scroll Bridge:
        Physical scrollbar track in the DOM monitored by GSAP ScrollTrigger.
        Pointer-events disabled to ensure no interference with 3D canvas interaction.
      */}
      <div
        ref={scrollBridgeRef}
        className="pointer-events-none w-full h-[500vh] opacity-0 select-none -z-10"
        aria-hidden="true"
        tabIndex={-1}
        data-testid="gallery-scroll-bridge"
      />
    </>
  );
}

export default GalleryCanvas;

