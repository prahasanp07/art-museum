'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalleryStore, type InspectTarget } from '@/store/useGalleryStore';

export interface CameraControllerProps {
  /**
   * Custom 3D CatmullRom spline path for camera translation through gallery corridors.
   * If omitted, a production-grade multi-corridor gallery spline is provided.
   */
  cameraCurve?: THREE.CatmullRomCurve3;
  /**
   * Custom 3D CatmullRom spline path for point-of-interest focus points.
   * If omitted, matching artwork focus points along corridor walls are provided.
   */
  lookAtCurve?: THREE.CatmullRomCurve3;
  /**
   * Stand-off distance along the artwork's surface normal during inspection.
   * Mandated to be 1.8m according to 03-camera-navigation.md.
   */
  inspectDistance?: number;
  /**
   * Exponential smoothing damping factor for camera position transitions.
   * Default: 4.0
   */
  positionDamping?: number;
  /**
   * Exponential smoothing damping factor for lookAt transitions.
   * Default: 5.0
   */
  lookAtDamping?: number;
}

/**
 * Default gallery corridor navigation waypoints (translation path).
 */
export const DEFAULT_CAMERA_WAYPOINTS: [number, number, number][] = [
  [0, 1.7, 12],     // Entrance foyer
  [0, 1.7, 5],      // Corridor entrance
  [2.5, 1.7, 0],    // Approaching wing A
  [2.5, 1.7, -6],   // Wing A gallery aisle
  [0, 1.7, -10],    // Transition rotunda
  [-2.5, 1.7, -14], // Wing B gallery aisle
  [-2.5, 1.7, -20], // Wing B alcove
  [0, 1.7, -24],    // Masterpiece pavilion
];

/**
 * Default points-of-interest directing camera focus towards wall-mounted artworks.
 */
export const DEFAULT_LOOKAT_WAYPOINTS: [number, number, number][] = [
  [0, 1.7, 8],      // Welcome curation
  [0, 1.7, 0],      // Corridor opening showcase
  [4.5, 1.7, 0],    // Wall artwork #1
  [4.5, 1.7, -6],   // Wall artwork #2
  [0, 1.7, -14],    // Rotunda centerpiece
  [-4.5, 1.7, -14], // Wall artwork #3
  [-4.5, 1.7, -20], // Wall artwork #4
  [0, 1.7, -28],    // Grand pavilion feature
];

/**
 * Helper to build a smooth CatmullRomCurve3 from 3D coordinates.
 */
export function createGalleryCurve(
  points: [number, number, number][],
  closed = false,
  tension = 0.5
): THREE.CatmullRomCurve3 {
  const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  return new THREE.CatmullRomCurve3(vectors, closed, 'catmullrom', tension);
}

/**
 * CameraController implements the exact specifications from:
 * - 02-performance-mandates.md (State Decoupling, Zero allocations per frame, No useState/useContext in useFrame)
 * - 03-camera-navigation.md (Dual CatmullRom curves, normalized progress t in [0, 1], 1.8m surface normal inspection mode)
 */
export function CameraController({
  cameraCurve,
  lookAtCurve,
  inspectDistance = 1.8,
  positionDamping = 4.0,
  lookAtDamping = 5.0,
}: CameraControllerProps) {
  const { camera } = useThree();

  // 1. Dual CatmullRomCurve3 splines memoized to avoid recalculations
  const activeCameraCurve = useMemo(
    () => cameraCurve ?? createGalleryCurve(DEFAULT_CAMERA_WAYPOINTS),
    [cameraCurve]
  );

  const activeLookAtCurve = useMemo(
    () => lookAtCurve ?? createGalleryCurve(DEFAULT_LOOKAT_WAYPOINTS),
    [lookAtCurve]
  );

  // 2. Pre-allocated Vector3 instances to satisfy the Zero Allocation / 60fps mandate:
  // NEVER instantiate `new THREE.Vector3()` inside `useFrame`
  const targetPosRef = useRef(new THREE.Vector3());
  const targetLookAtRef = useRef(new THREE.Vector3());
  const currentPosRef = useRef(new THREE.Vector3());
  const currentLookAtRef = useRef(new THREE.Vector3());
  const scratchArtworkPosRef = useRef(new THREE.Vector3());
  const scratchNormalRef = useRef(new THREE.Vector3());
  const isInitializedRef = useRef(false);

  useFrame((_, delta) => {
    // 3. Strict State Decoupling (02-performance-mandates.md):
    // Never invoke React useState or useContext inside useFrame.
    // Read transiently from Zustand store via useGalleryStore.getState().
    const { scrollProgress, isInspecting, activeArtworkTransform } = useGalleryStore.getState();

    const targetPos = targetPosRef.current;
    const targetLookAt = targetLookAtRef.current;
    const currentPos = currentPosRef.current;
    const currentLookAt = currentLookAtRef.current;

    // Clamp delta to prevent positional jumps if the browser tab loses focus
    const dt = Math.min(delta, 0.1);

    if (isInspecting && activeArtworkTransform) {
      // 4. Inspection Mode (03-camera-navigation.md, Section 4):
      // Camera position lerps directly to the artwork's target camera position and lookAt vector
      // and pauses spline advancement until dismissed.
      const dist = activeArtworkTransform.distance ?? inspectDistance;

      // Extract target position directly
      if (activeArtworkTransform.targetPosition) {
        if (activeArtworkTransform.targetPosition instanceof THREE.Vector3) {
          targetPos.copy(activeArtworkTransform.targetPosition);
        } else {
          targetPos.set(
            activeArtworkTransform.targetPosition[0],
            activeArtworkTransform.targetPosition[1],
            activeArtworkTransform.targetPosition[2]
          );
        }
      } else if (activeArtworkTransform.position) {
        if (activeArtworkTransform.position instanceof THREE.Vector3) {
          scratchArtworkPosRef.current.copy(activeArtworkTransform.position);
        } else {
          scratchArtworkPosRef.current.set(
            activeArtworkTransform.position[0],
            activeArtworkTransform.position[1],
            activeArtworkTransform.position[2]
          );
        }
        if (activeArtworkTransform.normal instanceof THREE.Vector3) {
          scratchNormalRef.current.copy(activeArtworkTransform.normal).normalize();
        } else if (Array.isArray(activeArtworkTransform.normal)) {
          scratchNormalRef.current
            .set(activeArtworkTransform.normal[0], activeArtworkTransform.normal[1], activeArtworkTransform.normal[2])
            .normalize();
        } else {
          scratchNormalRef.current.set(0, 0, 1);
        }
        targetPos.copy(scratchArtworkPosRef.current).addScaledVector(scratchNormalRef.current, dist);
      }

      // Extract target lookAt directly
      if (activeArtworkTransform.targetLookAt) {
        if (activeArtworkTransform.targetLookAt instanceof THREE.Vector3) {
          targetLookAt.copy(activeArtworkTransform.targetLookAt);
        } else {
          targetLookAt.set(
            activeArtworkTransform.targetLookAt[0],
            activeArtworkTransform.targetLookAt[1],
            activeArtworkTransform.targetLookAt[2]
          );
        }
      } else if (activeArtworkTransform.lookAt) {
        if (activeArtworkTransform.lookAt instanceof THREE.Vector3) {
          targetLookAt.copy(activeArtworkTransform.lookAt);
        } else {
          targetLookAt.set(
            activeArtworkTransform.lookAt[0],
            activeArtworkTransform.lookAt[1],
            activeArtworkTransform.lookAt[2]
          );
        }
      } else {
        targetLookAt.copy(targetPos);
      }
    } else {
      // 5. Scrollytelling Mode (03-camera-navigation.md, Section 1):
      // Parameterized 3D path governed by normalized progress t in [0, 1]
      const t = THREE.MathUtils.clamp(scrollProgress, 0, 1);
      activeCameraCurve.getPointAt(t, targetPos);
      activeLookAtCurve.getPointAt(t, targetLookAt);
    }

    // 6. Seamless first-frame initialization (avoids jarring fly-in from origin [0, 0, 0])
    if (!isInitializedRef.current) {
      currentPos.copy(targetPos);
      currentLookAt.copy(targetLookAt);
      camera.position.copy(targetPos);
      camera.lookAt(targetLookAt);
      isInitializedRef.current = true;
      return;
    }

    // 7. Framerate-independent exponential smoothing damping:
    // alpha = 1 - exp(-damping * dt)
    const posAlpha = 1 - Math.exp(-positionDamping * dt);
    const lookAtAlpha = 1 - Math.exp(-lookAtDamping * dt);

    currentPos.lerp(targetPos, posAlpha);
    currentLookAt.lerp(targetLookAt, lookAtAlpha);

    camera.position.copy(currentPos);
    camera.lookAt(currentLookAt);
  });

  return null;
}

export default CameraController;
