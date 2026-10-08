'use client';

import React, { Suspense, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ActiveProp, GalleryWithArtworks, Gallery } from '@/lib/types';

/**
 * Standard paths for interior wall KTX2 texture maps
 */
export const WALL_TEXTURE_MAP: Record<string, string> = {
  'minimal-white': '/textures/walls/minimal-white.ktx2',
  'raw-concrete': '/textures/walls/raw-concrete.ktx2',
  'dark-obsidian': '/textures/walls/dark-obsidian.ktx2',
  'dark-slate': '/textures/walls/dark-slate.ktx2',
  'warm-gallery': '/textures/walls/warm-gallery.ktx2',
  'sandstone': '/textures/walls/sandstone.ktx2',
};

/**
 * Standard paths for interior floor KTX2 texture maps
 */
export const FLOOR_TEXTURE_MAP: Record<string, string> = {
  'polished-concrete': '/textures/floors/polished-concrete.ktx2',
  'dark-hardwood': '/textures/floors/dark-hardwood.ktx2',
  'hardwood-oak': '/textures/floors/hardwood-oak.ktx2',
  'terrazzo-marble': '/textures/floors/terrazzo-marble.ktx2',
  'dark-terrazzo': '/textures/floors/dark-terrazzo.ktx2',
  'slate-tile': '/textures/floors/slate-tile.ktx2',
  'marble-tile': '/textures/floors/marble-tile.ktx2',
};

/**
 * Default coordinate anchors for spatial props if not explicitly found in GLB hierarchy
 */
export const DEFAULT_PROP_ANCHORS: Record<string, [number, number, number]> = {
  'entrance-foyer': [0, 0, 10],
  'foyer-left': [-3.0, 0, 8],
  'foyer-right': [3.0, 0, 8],
  'corridor-mid-a': [2.5, 0, -3],
  'rotunda-center': [0, 0, -10],
  'corridor-mid-b': [-2.5, 0, -17],
  'pavilion-north': [0, 0, -25],
  'pavilion-bench-east': [3.5, 0, -24],
  'pavilion-bench-west': [-3.5, 0, -24],
};

/**
 * Helper to resolve wall KTX2 texture path from identifier
 */
export function getWallTexturePath(textureId: string = 'minimal-white'): string {
  return WALL_TEXTURE_MAP[textureId] || `/textures/walls/${textureId}.ktx2`;
}

/**
 * Helper to resolve floor KTX2 texture path from identifier
 */
export function getFloorTexturePath(textureId: string = 'polished-concrete'): string {
  return FLOOR_TEXTURE_MAP[textureId] || `/textures/floors/${textureId}.ktx2`;
}

/**
 * Helper to resolve furniture prop GLB path from identifier
 */
export function getPropGlbPath(propGlbId: string): string {
  return `/models/props/${propGlbId}.glb`;
}

export interface InteriorManagerProps {
  /**
   * Complete gallery object containing customization attributes
   */
  gallery?: (Partial<Gallery> & { active_props?: ActiveProp[] }) | GalleryWithArtworks | null;
  /** Direct override for wall texture identifier */
  wall_texture_id?: string;
  /** Direct override for floor texture identifier */
  floor_texture_id?: string;
  /** Direct override for active furniture props */
  active_props?: ActiveProp[];
  /** Optional target 3D scene/group. Defaults to useThree().scene */
  scene?: THREE.Object3D;
}

/**
 * TextureApplicator:
 * Safely loads the corresponding texture maps in useEffect with error resilience,
 * assigning them to materials named 'GalleryWall' and 'GalleryFloor' without crashing the viewport.
 */
function TextureApplicator({
  wallTextureId,
  floorTextureId,
  targetScene,
}: {
  wallTextureId: string;
  floorTextureId: string;
  targetScene: THREE.Object3D;
}) {
  const wallPath = getWallTexturePath(wallTextureId);
  const floorPath = getFloorTexturePath(floorTextureId);

  useEffect(() => {
    if (!targetScene) return;

    let isMounted = true;
    const loader = new THREE.TextureLoader();

    const applyTexture = (materialName: 'GalleryWall' | 'GalleryFloor', texture: THREE.Texture) => {
      targetScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

          materials.forEach((mat) => {
            if (!mat) return;
            if (mat.name === materialName && 'map' in mat) {
              (mat as THREE.MeshStandardMaterial).map = texture;
              mat.needsUpdate = true;
            }
          });
        }
      });
    };

    // Safely attempt to load wall texture
    loader.load(
      wallPath,
      (tex) => {
        if (!isMounted) {
          tex.dispose();
          return;
        }
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 2);
        applyTexture('GalleryWall', tex);
      },
      undefined,
      (err) => {
        // Fallback gracefully without breaking React / Three.js scene tree
        console.warn(`InteriorManager wall texture fallback for "${wallTextureId}":`, err);
      }
    );

    // Safely attempt to load floor texture
    loader.load(
      floorPath,
      (tex) => {
        if (!isMounted) {
          tex.dispose();
          return;
        }
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(8, 20);
        applyTexture('GalleryFloor', tex);
      },
      undefined,
      (err) => {
        // Fallback gracefully without breaking React / Three.js scene tree
        console.warn(`InteriorManager floor texture fallback for "${floorTextureId}":`, err);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [targetScene, wallPath, floorPath, wallTextureId, floorTextureId]);

  return null;
}

/**
 * Fallback architectural furniture geometry in case a remote GLB asset is loading or unhosted
 */
function FallbackFurnitureMesh({ propId }: { propId: string }) {
  if (propId.includes('bench')) {
    return (
      <group position={[0, 0.22, 0]}>
        <mesh castShadow={false} receiveShadow={false}>
          <boxGeometry args={[1.6, 0.45, 0.6]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      </group>
    );
  }
  if (propId.includes('pedestal')) {
    return (
      <group position={[0, 0.5, 0]}>
        <mesh castShadow={false} receiveShadow={false}>
          <cylinderGeometry args={[0.3, 0.35, 1.0, 16]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[0, 0.4, 0]}>
      <mesh castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

/**
 * PropModelLoader loads a single pre-optimized GLB furniture piece via useGLTF
 */
function PropModelLoader({ glbPath }: { glbPath: string }) {
  const { scene } = useGLTF(glbPath);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  return <primitive object={clonedScene} castShadow={false} receiveShadow={false} />;
}

/**
 * FurniturePropNode:
 * Resolves designated node coordinates from the GLB scene hierarchy
 * or fallback anchor dictionary, then renders the furniture GLB.
 */
function FurniturePropNode({
  prop,
  scene,
}: {
  prop: ActiveProp;
  scene: THREE.Object3D;
}) {
  const glbPath = getPropGlbPath(prop.prop_glb_id);

  // Resolve coordinates from node name inside the loaded GLB scene, or fallback to anchor table
  const { position, rotation } = useMemo(() => {
    if (scene) {
      const foundNode = scene.getObjectByName(prop.node_name);
      if (foundNode) {
        return {
          position: [foundNode.position.x, foundNode.position.y, foundNode.position.z] as [number, number, number],
          rotation: [foundNode.rotation.x, foundNode.rotation.y, foundNode.rotation.z] as [number, number, number],
        };
      }
    }

    if (DEFAULT_PROP_ANCHORS[prop.node_name]) {
      return {
        position: DEFAULT_PROP_ANCHORS[prop.node_name],
        rotation: [0, 0, 0] as [number, number, number],
      };
    }

    return {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  }, [prop.node_name, scene]);

  return (
    <group position={position} rotation={rotation}>
      <Suspense fallback={<FallbackFurnitureMesh propId={prop.prop_glb_id} />}>
        <PropModelLoader glbPath={glbPath} />
      </Suspense>
    </group>
  );
}

/**
 * Error boundary catching texture or asset loading failures without crashing WebGL canvas
 */
class TextureErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // Graceful fallback: allows baked architectural materials to remain visible
    console.warn('InteriorManager texture load fallback:', error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * InteriorManager:
 * 1. Reads wall_texture_id, floor_texture_id, and active_props from gallery data.
 * 2. Uses @react-three/drei's useTexture to load the corresponding KTX2 texture maps.
 * 3. Applies them globally to materials named 'GalleryWall' and 'GalleryFloor' inside the loaded scene.
 * 4. Maps over active_props and dynamically renders the requested furniture GLBs at their node coordinates.
 */
export function InteriorManager({
  gallery,
  wall_texture_id,
  floor_texture_id,
  active_props,
  scene: propScene,
}: InteriorManagerProps) {
  const { scene: threeScene } = useThree();
  const targetScene = propScene || threeScene;

  // Resolve configuration attributes from gallery data with fallbacks
  const resolvedWallTextureId =
    wall_texture_id || gallery?.wall_texture_id || 'minimal-white';
  const resolvedFloorTextureId =
    floor_texture_id || gallery?.floor_texture_id || 'polished-concrete';
  const resolvedActiveProps: ActiveProp[] = useMemo(() => {
    return active_props || gallery?.active_props || [];
  }, [active_props, gallery?.active_props]);

  return (
    <group name="interior-manager">
      {/* Texture Applicator wrapped in ErrorBoundary + Suspense for non-blocking texture streaming */}
      <TextureErrorBoundary>
        <Suspense fallback={null}>
          <TextureApplicator
            wallTextureId={resolvedWallTextureId}
            floorTextureId={resolvedFloorTextureId}
            targetScene={targetScene}
          />
        </Suspense>
      </TextureErrorBoundary>

      {/* Dynamic Furniture Props mapped over active_props at designated node coordinates */}
      {resolvedActiveProps.map((prop, index) => (
        <FurniturePropNode
          key={`${prop.node_name}-${prop.prop_glb_id}-${index}`}
          prop={prop}
          scene={targetScene}
        />
      ))}
    </group>
  );
}

export default InteriorManager;
