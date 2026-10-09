'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore } from '@/store/useGalleryStore';
import { Artwork, FrameDesign, GalleryInteriorConfig, SlotConfiguration } from '@/lib/types';
import { FRAME_PROFILES, FRAME_DESIGNS } from '@/lib/mockData';

interface ArtworkPlaneProps {
  artwork: Artwork;
  width: number;
  height: number;
  onAspectCalculated?: (aspect: number) => void;
}

/**
 * Visual styling and physical molding dimensions for 3D exhibition frames.
 */
export interface FrameStyle {
  id?: string;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  border: number;
  depth: number;
}

/**
 * Standard curatorial frame profiles mapped to GLB / style identifiers.
 */
export const FRAME_STYLES: Record<string, FrameStyle> = {
  ...Object.fromEntries(
    Object.entries(FRAME_PROFILES).map(([key, val]) => [
      key,
      {
        id: val.id,
        name: val.name,
        color: val.color,
        roughness: val.roughness,
        metalness: val.metalness,
        border: val.border ?? 0.08,
        depth: val.depth ?? 0.06,
      },
    ])
  ),
};

/**
 * Resolves frame styling parameters from an interior_config frame GLB identifier.
 */
export function getFrameStyle(frameGlbId: string = 'minimal-black'): FrameStyle {
  return FRAME_STYLES[frameGlbId] || FRAME_STYLES['minimal-black'];
}

/**
 * Resolves physical frame architectural design and mounting geometry.
 */
export function getFrameDesign(designId: string = 'classic-box'): FrameDesign {
  return FRAME_DESIGNS[designId] || FRAME_DESIGNS['classic-box'];
}

/**
 * Procedural digital art generator:
 * Used as a 100% reliable, zero-latency in-memory fallback if a remote image
 * is blocked by CORS policy, network timeout, or CDN rate limiting.
 */
function createProceduralArtworkTexture(title: string, id: string): THREE.CanvasTexture {
  if (typeof window === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  const palettes = [
    ['#070a13', '#06b6d4', '#3b82f6', '#8b5cf6'],
    ['#0a0815', '#ec4899', '#8b5cf6', '#3b82f6'],
    ['#03140e', '#10b981', '#06b6d4', '#6366f1'],
    ['#150d2a', '#6366f1', '#a855f7', '#ec4899'],
    ['#150905', '#f59e0b', '#ef4444', '#7c3aed'],
    ['#070e17', '#14b8a6', '#0ea5e9', '#6366f1'],
  ];

  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const [c0, c1, c2, c3] = palettes[Math.abs(hash) % palettes.length];

  const grad = ctx.createRadialGradient(512, 512, 80, 512, 512, 640);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.4, c2);
  grad.addColorStop(0.75, c3);
  grad.addColorStop(1, c0);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 20; i++) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + (i % 4) * 0.05})`;
    ctx.beginPath();
    ctx.arc(512, 512, 60 + i * 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 38px monospace';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText(title.toUpperCase(), 512, 900);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  return texture;
}

function FallbackArtworkPlane({ width, height }: { width: number; height: number }) {
  return (
    <mesh castShadow={false} receiveShadow={false}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color="#1e293b" />
    </mesh>
  );
}

/**
 * Inner artwork plane with resilient texture loader.
 * Measures texture aspect ratio and reports it to the parent for dynamic frame scaling.
 */
function ArtworkPlane({
  artwork,
  width,
  height,
  onAspectCalculated,
}: ArtworkPlaneProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;
    let currentTexture: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const tryLoad = (url: string, isProxy = false) => {
      loader.load(
        url,
        (loadedTex) => {
          if (!active) {
            loadedTex.dispose();
            return;
          }
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTex.magFilter = THREE.LinearFilter;
          loadedTex.generateMipmaps = true;
          currentTexture = loadedTex;
          setTexture(loadedTex);

          // Dynamically compute natural aspect ratio from loaded artwork dimensions
          if (loadedTex.image && loadedTex.image.width && loadedTex.image.height) {
            const aspect = loadedTex.image.width / loadedTex.image.height;
            if (aspect > 0 && isFinite(aspect)) {
              onAspectCalculated?.(aspect);
            }
          }
        },
        undefined,
        () => {
          if (!active) return;
          // If direct load failed on an external http/https URL, try via proxy before procedural fallback
          if (!isProxy && (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/api/proxy-image')) {
            tryLoad(`/api/proxy-image?url=${encodeURIComponent(url)}`, true);
            return;
          }
          const fallbackTex = createProceduralArtworkTexture(artwork.title, artwork.id);
          currentTexture = fallbackTex;
          setTexture(fallbackTex);
          onAspectCalculated?.(1.0);
        }
      );
    };

    tryLoad(artwork.storage_url);

    return () => {
      active = false;
      if (currentTexture) {
        currentTexture.dispose();
      }
    };
  }, [artwork.storage_url, artwork.title, artwork.id, onAspectCalculated]);

  if (!texture) {
    return <FallbackArtworkPlane width={width} height={height} />;
  }

  return (
    <mesh castShadow={false} receiveShadow={false}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.2}
        metalness={0.05}
        toneMapped={true}
      />
    </mesh>
  );
}

/**
 * InstancedFrame renders a 3D architectural frame and mounting design using THREE.InstancedMesh.
 * - Conforms strictly to 02-performance-mandates.md (<200 draw-call budget).
 * - Dynamically adapts geometry across:
 *   1. 'classic-box' (flush right-angled museum bezel)
 *   2. 'deep-shadowbox' (extruded depth with perimeter floating reveal channel)
 *   3. 'passe-partout' (conservation matboard inset surrounded by outer framing trim)
 *   4. 'tiered-baroque' (8-segment double-step tiered architectural moulding relief)
 *   5. 'canvas-float' (ultra-slim contemporary floating edge rail)
 */
function InstancedFrame({
  width,
  height,
  frameStyle,
  frameDesign,
  hovered,
}: {
  width: number;
  height: number;
  frameStyle: FrameStyle;
  frameDesign: FrameDesign;
  hovered: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());
  const colorRef = useRef(new THREE.Color());

  const borderMult = frameDesign.borderMultiplier || 1.0;
  const depthMult = frameDesign.depthMultiplier || 1.0;
  const border = frameStyle.border * borderMult;
  const depth = frameStyle.depth * depthMult;
  const floatingGap = frameDesign.floatingGap || 0;
  const hasMat = Boolean(frameDesign.hasMat);
  const matWidth = hasMat ? (frameDesign.matWidth || 0.12) : 0;
  const isTiered = frameDesign.id === 'tiered-baroque';

  const { color, roughness, metalness } = frameStyle;

  // Single unit cube geometry shared across all instanced border segments
  const unitBoxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(1, 1, 1),
        roughness,
        metalness,
        toneMapped: true,
      }),
    [roughness, metalness]
  );

  const matMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(frameDesign.matColor || '#f1f0ea'),
        roughness: 0.94,
        metalness: 0.02,
        toneMapped: true,
      }),
    [frameDesign.matColor]
  );

  // Opening boundary between the inner mat/gap and the outer moulding
  const openingW = width + (floatingGap + matWidth) * 2;
  const openingH = height + (floatingGap + matWidth) * 2;

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = dummyRef.current;
    const activeColor = colorRef.current.set(hovered ? '#38bdf8' : color);

    if (isTiered) {
      // 8-instance stepped moulding relief: 0-3 outer step, 4-7 inner stepped bevel fillet
      const outerBorder = border * 0.65;
      const innerBorder = border * 0.45;
      const outerDepth = depth;
      const innerDepth = depth * 0.82;

      // Outer tier
      dummy.position.set(0, (openingH + innerBorder * 2 + outerBorder) / 2, outerDepth / 2);
      dummy.scale.set(openingW + (innerBorder + outerBorder) * 2, outerBorder, outerDepth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(0, dummy.matrix);
      mesh.setColorAt(0, activeColor);

      dummy.position.set(0, -(openingH + innerBorder * 2 + outerBorder) / 2, outerDepth / 2);
      dummy.scale.set(openingW + (innerBorder + outerBorder) * 2, outerBorder, outerDepth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(1, dummy.matrix);
      mesh.setColorAt(1, activeColor);

      dummy.position.set(-(openingW + innerBorder * 2 + outerBorder) / 2, 0, outerDepth / 2);
      dummy.scale.set(outerBorder, openingH + innerBorder * 2, outerDepth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(2, dummy.matrix);
      mesh.setColorAt(2, activeColor);

      dummy.position.set((openingW + innerBorder * 2 + outerBorder) / 2, 0, outerDepth / 2);
      dummy.scale.set(outerBorder, openingH + innerBorder * 2, outerDepth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(3, dummy.matrix);
      mesh.setColorAt(3, activeColor);

      // Inner stepped tier
      dummy.position.set(0, (openingH + innerBorder) / 2, innerDepth / 2);
      dummy.scale.set(openingW + innerBorder * 2, innerBorder, innerDepth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(4, dummy.matrix);
      mesh.setColorAt(4, activeColor);

      dummy.position.set(0, -(openingH + innerBorder) / 2, innerDepth / 2);
      dummy.scale.set(openingW + innerBorder * 2, innerBorder, innerDepth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(5, dummy.matrix);
      mesh.setColorAt(5, activeColor);

      dummy.position.set(-(openingW + innerBorder) / 2, 0, innerDepth / 2);
      dummy.scale.set(innerBorder, openingH, innerDepth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(6, dummy.matrix);
      mesh.setColorAt(6, activeColor);

      dummy.position.set((openingW + innerBorder) / 2, 0, innerDepth / 2);
      dummy.scale.set(innerBorder, openingH, innerDepth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(7, dummy.matrix);
      mesh.setColorAt(7, activeColor);
    } else {
      // 4-instance perimeter moulding frame
      dummy.position.set(0, (openingH + border) / 2, depth / 2);
      dummy.scale.set(openingW + border * 2, border, depth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(0, dummy.matrix);
      mesh.setColorAt(0, activeColor);

      dummy.position.set(0, -(openingH + border) / 2, depth / 2);
      dummy.scale.set(openingW + border * 2, border, depth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(1, dummy.matrix);
      mesh.setColorAt(1, activeColor);

      dummy.position.set(-(openingW + border) / 2, 0, depth / 2);
      dummy.scale.set(border, openingH, depth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(2, dummy.matrix);
      mesh.setColorAt(2, activeColor);

      dummy.position.set((openingW + border) / 2, 0, depth / 2);
      dummy.scale.set(border, openingH, depth);
      dummy.quaternion.identity();
      dummy.updateMatrix();
      mesh.setMatrixAt(3, dummy.matrix);
      mesh.setColorAt(3, activeColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [openingW, openingH, border, depth, color, hovered, isTiered]);

  // Passe-Partout Matboard layout effect
  useLayoutEffect(() => {
    if (!hasMat || !matMeshRef.current) return;
    const matMesh = matMeshRef.current;
    const dummy = dummyRef.current;
    const matDepth = depth * 0.35;
    const matZ = depth * 0.18;

    dummy.position.set(0, (height + matWidth) / 2, matZ);
    dummy.scale.set(width + matWidth * 2, matWidth, matDepth);
    dummy.quaternion.identity();
    dummy.updateMatrix();
    matMesh.setMatrixAt(0, dummy.matrix);

    dummy.position.set(0, -(height + matWidth) / 2, matZ);
    dummy.scale.set(width + matWidth * 2, matWidth, matDepth);
    dummy.quaternion.identity();
    dummy.updateMatrix();
    matMesh.setMatrixAt(1, dummy.matrix);

    dummy.position.set(-(width + matWidth) / 2, 0, matZ);
    dummy.scale.set(matWidth, height, matDepth);
    dummy.quaternion.identity();
    dummy.updateMatrix();
    matMesh.setMatrixAt(2, dummy.matrix);

    dummy.position.set((width + matWidth) / 2, 0, matZ);
    dummy.scale.set(matWidth, height, matDepth);
    dummy.quaternion.identity();
    dummy.updateMatrix();
    matMesh.setMatrixAt(3, dummy.matrix);

    matMesh.instanceMatrix.needsUpdate = true;
  }, [width, height, matWidth, depth, hasMat]);

  return (
    <group>
      {/* Outer or Tiered Frame Moulding */}
      <instancedMesh
        key={`${frameStyle.id || ''}-${frameDesign.id}-${color}-${roughness}-${metalness}`}
        ref={meshRef}
        args={[unitBoxGeometry, frameMaterial, isTiered ? 8 : 4]}
        castShadow={false}
        receiveShadow={false}
      />

      {/* Passe-Partout Archival Matboard */}
      {hasMat && (
        <instancedMesh
          key={`matboard-${frameDesign.id}-${width}-${height}`}
          ref={matMeshRef}
          args={[unitBoxGeometry, matMaterial, 4]}
          castShadow={false}
          receiveShadow={false}
        />
      )}
    </group>
  );
}

export interface GallerySlotProps {
  config: SlotConfiguration;
  artwork?: Artwork | null;
  interiorConfig?: GalleryInteriorConfig;
  frameGlbId?: string;
  frameDesignId?: string;
}

/**
 * GallerySlot renders an architectural exhibition bay for an artwork.
 * Adheres strictly to:
 * - Dynamic bounding box calculation matching artwork aspect ratio.
 * - Selected frame material style (e.g. neo-chrome, matte-brass, floating-shadow-box).
 * - Selected frame architectural design (e.g. classic-box, deep-shadowbox, passe-partout, tiered-baroque, canvas-float).
 * - Frame meshes rendered via InstancedMesh to maintain strict 200 draw-call budget.
 * - 2D artwork texture mounted on a plane slightly recessed inside the 3D frame geometry.
 * - 03-camera-navigation (Dynamic optimal inspection distance with FOV calculation).
 */
export function GallerySlot({
  config,
  artwork,
  interiorConfig,
  frameGlbId,
  frameDesignId,
}: GallerySlotProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Initial aspect ratio fallback from slot configuration dimensions
  const [aspectRatio, setAspectRatio] = useState<number>(
    () => config.size[0] / config.size[1]
  );

  // Resolve frame GLB ID from explicit prop, interiorConfig frames, slot or artwork
  const resolvedFrameGlbId =
    frameGlbId ||
    interiorConfig?.frames?.find(
      (f: any) =>
        f.slot_identifier === config.identifier ||
        (artwork?.id && f.artwork_id === artwork.id)
    )?.frame_glb_id ||
    (artwork as any)?.frame_glb_id ||
    'minimal-black';

  const frameStyle = useMemo(
    () => getFrameStyle(resolvedFrameGlbId),
    [resolvedFrameGlbId]
  );

  // Resolve frame architectural design geometry
  const resolvedFrameDesignId =
    frameDesignId ||
    interiorConfig?.frames?.find(
      (f: any) =>
        f.slot_identifier === config.identifier ||
        (artwork?.id && f.artwork_id === artwork.id)
    )?.frame_design_id ||
    (artwork as any)?.frame_design_id ||
    'classic-box';

  const frameDesign = useMemo(
    () => getFrameDesign(resolvedFrameDesignId),
    [resolvedFrameDesignId]
  );

  // =========================================================================
  // Dynamic Bounding Box Calculation:
  // Scale within slot max dimensions while strictly preserving artwork aspect ratio.
  // =========================================================================
  const [maxWidth, maxHeight] = config.size;
  const { fittedWidth, fittedHeight } = useMemo(() => {
    const slotAspect = maxWidth / maxHeight;
    let w = maxWidth;
    let h = maxHeight;

    if (aspectRatio >= slotAspect) {
      // Artwork is wider than slot: clamp to max width
      w = maxWidth;
      h = maxWidth / aspectRatio;
    } else {
      // Artwork is taller than slot: clamp to max height
      h = maxHeight;
      w = maxHeight * aspectRatio;
    }

    return {
      fittedWidth: Math.max(0.4, w),
      fittedHeight: Math.max(0.4, h),
    };
  }, [maxWidth, maxHeight, aspectRatio]);

  // Recessed plane position: mounted inside the 3D frame's depth
  const effectiveDepth = frameStyle.depth * (frameDesign.depthMultiplier || 1.0);
  const effectiveBorder =
    frameStyle.border * (frameDesign.borderMultiplier || 1.0) +
    (frameDesign.floatingGap || 0) +
    (frameDesign.hasMat ? (frameDesign.matWidth || 0.12) : 0);
  const recessedPlaneZ = effectiveDepth * 0.25;

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (!artwork) return;

    // 1. Dynamic bounding box dimensions (width and height including frame borders & gaps)
    const totalArtworkWidth = fittedWidth + effectiveBorder * 2;
    const totalArtworkHeight = fittedHeight + effectiveBorder * 2;

    // 2. Camera current FOV in radians & aspect ratio
    const persCamera = camera as THREE.PerspectiveCamera;
    const fovDegrees = persCamera.fov ?? 55;
    const fov = (fovDegrees * Math.PI) / 180;
    const aspect =
      persCamera.aspect ||
      (typeof window !== 'undefined'
        ? window.innerWidth / window.innerHeight
        : 16 / 9);

    // 3. Distance required to fit height
    const distY = (totalArtworkHeight / 2) / Math.tan(fov / 2);

    // 4. Distance required to fit width
    const distX = (totalArtworkWidth / 2) / Math.tan(fov / 2) / aspect;

    // 5. Optimal viewing distance with 15% curatorial breathing padding
    const optimalDistance = Math.max(distX, distY) * 1.15;

    // 6. Normal vector offset along the wall perpendicular
    const normalLen =
      Math.hypot(config.normal[0], config.normal[1], config.normal[2]) || 1;
    const normX = config.normal[0] / normalLen;
    const normY = config.normal[1] / normalLen;
    const normZ = config.normal[2] / normalLen;

    const cameraOffset: [number, number, number] = [
      normX * optimalDistance,
      normY * optimalDistance,
      normZ * optimalDistance,
    ];

    const targetPosition: [number, number, number] = [
      config.position[0] + cameraOffset[0],
      config.position[1] + cameraOffset[1],
      config.position[2] + cameraOffset[2],
    ];

    // Release pointer lock if engaged so cursor is available for the placard
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock();
      useGalleryStore.getState().setIsPointerLocked(false);
    }

    useGalleryStore.getState().enterInspection({
      artworkId: artwork.id,
      targetPosition,
      targetLookAt: config.position,
      position: config.position,
      normal: config.normal,
      distance: optimalDistance,
      cameraOffset,
    });
  };

  return (
    <group
      ref={groupRef}
      position={config.position}
      rotation={config.rotation}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (artwork?.id) {
          useGalleryStore.getState().setActiveArtworkId(artwork.id);
        }
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        if (artwork?.id && useGalleryStore.getState().activeArtworkId === artwork.id) {
          useGalleryStore.getState().setActiveArtworkId(null);
        }
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'default';
        }
      }}
    >
      {/* 
        1. 3D Architectural Frame via InstancedMesh:
        - Scales dynamically to enclose the artwork's aspect ratio.
        - Dynamically applies chosen architectural design (Box, Shadow Box, Passe-Partout, Tiered, Float).
      */}
      <InstancedFrame
        width={fittedWidth}
        height={fittedHeight}
        frameStyle={frameStyle}
        frameDesign={frameDesign}
        hovered={hovered}
      />

      {/* 
        2. Recessed Artwork Backplate:
        Dark interior backing plane preventing light leaks behind the canvas & shadow moat.
      */}
      <mesh
        position={[0, 0, 0.002]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry
          args={[
            fittedWidth + (frameDesign.floatingGap || 0) * 2 + 0.02,
            fittedHeight + (frameDesign.floatingGap || 0) * 2 + 0.02,
          ]}
        />
        <meshBasicMaterial color="#080a0f" />
      </mesh>

      {/* 
        3. Recessed 2D Artwork Texture Plane:
        Mounted on a plane slightly recessed inside the 3D frame geometry (Z = recessedPlaneZ),
        while the 3D frame moldings project forward to Z = effectiveDepth.
      */}
      <group position={[0, 0, recessedPlaneZ]}>
        {artwork ? (
          <Suspense
            fallback={
              <FallbackArtworkPlane
                width={fittedWidth}
                height={fittedHeight}
              />
            }
          >
            <ArtworkPlane
              artwork={artwork}
              width={fittedWidth}
              height={fittedHeight}
              onAspectCalculated={setAspectRatio}
            />
          </Suspense>
        ) : (
          <FallbackArtworkPlane
            width={fittedWidth}
            height={fittedHeight}
          />
        )}
      </group>

      {/* 
        4. Museum Wall Placard beneath the frame
      */}
      {artwork && (
        <group position={[0, -(fittedHeight / 2 + effectiveBorder + 0.16), 0.02]}>
          <mesh castShadow={false} receiveShadow={false}>
            <planeGeometry args={[0.6, 0.16]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default GallerySlot;
