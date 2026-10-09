'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  PointerLockControls,
  useKeyboardControls,
  KeyboardControls,
  type KeyboardControlsEntry,
} from '@react-three/drei';
import * as THREE from 'three';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import { useGalleryStore } from '@/store/useGalleryStore';

/**
 * Control action identifiers for first-person movement.
 */
export type FreeRoamControls = 'forward' | 'backward' | 'left' | 'right';

/**
 * Default keyboard bindings supporting both WASD and Arrow key mappings.
 */
export const defaultKeyboardMap: KeyboardControlsEntry<FreeRoamControls>[] = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp', 'w', 'W'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown', 's', 'S'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft', 'a', 'A'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight', 'd', 'D'] },
];

export interface FreeRoamControllerProps {
  /**
   * Walking speed in meters per second.
   * Default: 5.0
   */
  moveSpeed?: number;
  /**
   * Eye-level camera height locked to the vertical axis.
   * Mandated to be 1.6 meters.
   * Default: 1.6
   */
  cameraY?: number;
  /**
   * Movement smoothing / deceleration damping factor.
   * Default: 10.0
   */
  damping?: number;
  /**
   * Explicit toggle flag for the controller.
   * If omitted, checks `navigationMode === 'freeroam'` from useGalleryStore.
   */
  enabled?: boolean;
  /**
   * Whether to require active pointer lock before processing WASD translations.
   * Default: false (enables seamless keyboard translation and testing)
   */
  requirePointerLock?: boolean;
  /**
   * Make this controller the default controls instance in R3F.
   * Default: true
   */
  makeDefault?: boolean;
  /**
   * Optional custom keyboard map for KeyboardControls.
   */
  keyboardMap?: KeyboardControlsEntry<FreeRoamControls>[];
  /**
   * Optional callback when pointer lock is engaged.
   */
  onLock?: () => void;
  /**
   * Optional callback when pointer lock is disengaged.
   */
  onUnlock?: () => void;
  /**
   * Optional forwarded ref to the underlying PointerLockControls instance.
   */
  controlsRef?: React.RefObject<PointerLockControlsImpl | null>;
  /**
   * Optional DOM selector targeted for pointer lock engagement.
   * Defaults to '#r3f-gallery-viewport canvas' to restrict lock to 3D scene.
   */
  selector?: string;
}

/**
 * Inner component that attaches to useKeyboardControls, useFrame, and PointerLockControls.
 */
function FreeRoamControllerImpl({
  moveSpeed = 5.0,
  cameraY = 1.6,
  damping = 10.0,
  enabled,
  requirePointerLock = false,
  makeDefault = true,
  onLock,
  onUnlock,
  controlsRef,
  selector = '#r3f-gallery-viewport canvas',
}: FreeRoamControllerProps) {
  const { camera, gl } = useThree();
  const [, getKeys] = useKeyboardControls<FreeRoamControls>();
  const internalControlsRef = useRef<PointerLockControlsImpl>(null);
  const activeControlsRef = controlsRef || internalControlsRef;

  // Track dragging state for mouse-drag look around when pointer lock is not active
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  // Global unhandledrejection & pointerlockerror safeguard to prevent Turbopack console errors
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        reason?.name === 'SecurityError' ||
        (typeof reason?.message === 'string' &&
          reason.message.toLowerCase().includes('pointer lock'))
      ) {
        event.preventDefault();
      }
    };

    // Capture-phase listener stops pointerlockerror from reaching Three.js PointerLockControls
    const handlePointerLockError = (event: Event) => {
      event.stopImmediatePropagation();
    };

    // Filter benign Three.js pointer lock API warning in dev overlay
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('THREE.PointerLockControls: Unable to use Pointer Lock API')
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('pointerlockerror', handlePointerLockError, { capture: true });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('pointerlockerror', handlePointerLockError, { capture: true });
      console.error = originalConsoleError;
    };
  }, []);

  // Patch controls.lock with catch block to prevent unhandled rejection during browser cooldown
  React.useEffect(() => {
    const ctrl = activeControlsRef.current;
    if (!ctrl) return;

    const originalLock = ctrl.lock.bind(ctrl);
    ctrl.lock = () => {
      try {
        if (ctrl.domElement) {
          const promise = ctrl.domElement.requestPointerLock();
          if (promise && typeof (promise as any).catch === 'function') {
            (promise as any).catch(() => {
              // Silently suppress SecurityError during the browser's 1.25s unlock cooldown
            });
          }
        }
      } catch {
        // Fallback for browsers that throw synchronously
      }
    };

    return () => {
      ctrl.lock = originalLock;
    };
  }, [activeControlsRef]);

  // Handle pointer drag rotation fallback when not locked
  React.useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (activeControlsRef.current?.isLocked) return;
      isDraggingRef.current = true;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (activeControlsRef.current?.isLocked) {
        canvas.style.cursor = 'crosshair';
        return;
      }
      if (!isDraggingRef.current) {
        canvas.style.cursor = 'grab';
        return;
      }

      const dx = e.clientX - lastPointerPosRef.current.x;
      const dy = e.clientY - lastPointerPosRef.current.y;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      const euler = eulerRef.current;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= dx * 0.0025;
      euler.x -= dy * 0.0025;
      // Clamp pitch to avoid gimbal flip
      euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.x));
      camera.quaternion.setFromEuler(euler);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const totalDist = Math.hypot(
        e.clientX - dragStartPosRef.current.x,
        e.clientY - dragStartPosRef.current.y
      );

      // If user merely clicked without dragging, request pointer lock smoothly
      if (totalDist < 5 && !activeControlsRef.current?.isLocked) {
        try {
          activeControlsRef.current?.lock();
        } catch {
          // Suppress
        }
      }

      if (!activeControlsRef.current?.isLocked) {
        canvas.style.cursor = 'grab';
      }
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [camera, gl.domElement, activeControlsRef]);

  // Lock and unlock handlers that synchronize with Zustand store
  const handleLock = React.useCallback(() => {
    useGalleryStore.getState().setIsPointerLocked(true);
    if (gl.domElement) {
      gl.domElement.style.cursor = 'crosshair';
    }
    onLock?.();
  }, [onLock, gl.domElement]);

  const handleUnlock = React.useCallback(() => {
    useGalleryStore.getState().setIsPointerLocked(false);
    if (gl.domElement) {
      gl.domElement.style.cursor = 'grab';
    }
    onUnlock?.();
  }, [onUnlock, gl.domElement]);

  // =========================================================================
  // Zero-Allocation Mandate (02-performance-mandates.md):
  // Initialize ALL THREE.Vector3 instances via useRef outside the useFrame loop
  // to prevent memory garbage collection spikes and maintain 60 FPS.
  // =========================================================================
  const forwardVecRef = useRef(new THREE.Vector3());
  const rightVecRef = useRef(new THREE.Vector3());
  const upVecRef = useRef(new THREE.Vector3(0, 1, 0));
  const moveDirRef = useRef(new THREE.Vector3());
  const targetVelocityRef = useRef(new THREE.Vector3());
  const velocityRef = useRef(new THREE.Vector3());
  const scratchVecRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // 1. Transient store read decoupled from React render cycle (02-performance-mandates.md)
    const { navigationMode, isInspecting } = useGalleryStore.getState();

    // Check if free roam mode is currently active
    const isModeActive = enabled !== undefined ? enabled : navigationMode === 'freeroam';
    if (!isModeActive) return;

    // Optional pointer lock requirement check
    if (requirePointerLock && !activeControlsRef.current?.isLocked) {
      return;
    }

    // 2. Query keyboard state transiently (zero React re-renders)
    const { forward, backward, left, right } = getKeys();

    // If inspecting an artwork and user presses navigation keys, dismiss inspection
    if (isInspecting && (forward || backward || left || right)) {
      useGalleryStore.getState().exitInspection();
    }

    const dt = Math.min(delta, 0.1);

    // 3. Obtain pre-allocated vector references
    const forwardVec = forwardVecRef.current;
    const rightVec = rightVecRef.current;
    const upVec = upVecRef.current;
    const moveDir = moveDirRef.current;
    const targetVelocity = targetVelocityRef.current;
    const velocity = velocityRef.current;
    const scratchVec = scratchVecRef.current;

    // 4. Calculate camera forward vector projected onto the horizontal XZ plane
    camera.getWorldDirection(forwardVec);
    forwardVec.y = 0;
    if (forwardVec.lengthSq() > 0.0001) {
      forwardVec.normalize();
    } else {
      forwardVec.set(0, 0, -1);
    }

    // 5. Calculate right strafe vector via cross product with World Up (0, 1, 0)
    rightVec.crossVectors(forwardVec, upVec).normalize();

    // 6. Calculate movement direction from WASD and Arrow key inputs
    let moveZ = 0;
    let moveX = 0;
    if (forward) moveZ += 1;
    if (backward) moveZ -= 1;
    if (right) moveX += 1;
    if (left) moveX -= 1;

    moveDir.set(0, 0, 0);
    if (moveZ !== 0) {
      scratchVec.copy(forwardVec).multiplyScalar(moveZ);
      moveDir.add(scratchVec);
    }
    if (moveX !== 0) {
      scratchVec.copy(rightVec).multiplyScalar(moveX);
      moveDir.add(scratchVec);
    }

    // Normalize diagonal movement to maintain consistent walking speed
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    // 7. Calculate velocity with framerate-independent exponential damping
    targetVelocity.copy(moveDir).multiplyScalar(moveSpeed);

    if (damping > 0) {
      const dampAlpha = 1 - Math.exp(-damping * dt);
      velocity.lerp(targetVelocity, dampAlpha);
    } else {
      velocity.copy(targetVelocity);
    }

    // 8. Translate camera position horizontally
    camera.position.addScaledVector(velocity, dt);

    // 9. Performance Mandate: Lock camera Y position strictly to 1.6 meters
    camera.position.y = cameraY;
  });

  return (
    <PointerLockControls
      ref={activeControlsRef}
      selector={selector}
      makeDefault={makeDefault}
      onLock={handleLock}
      onUnlock={handleUnlock}
    />
  );
}

/**
 * FreeRoamController provides first-person WASD + Arrow navigation with mouse look.
 * - Wraps with KeyboardControls to ensure useKeyboardControls is always available.
 * - Enforces zero-allocation Vector3 recycling in useFrame.
 * - Locks eye level height strictly to 1.6m.
 */
export function FreeRoamController(props: FreeRoamControllerProps) {
  return (
    <KeyboardControls map={props.keyboardMap ?? defaultKeyboardMap}>
      <FreeRoamControllerImpl {...props} />
    </KeyboardControls>
  );
}

export { FreeRoamControllerImpl as FreeRoamCamera };

export default FreeRoamController;
