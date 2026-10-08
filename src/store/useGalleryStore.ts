import { create } from 'zustand';
import * as THREE from 'three';

/**
 * Object holding the target camera position and lookAt vector for artwork inspection.
 */
export interface ActiveArtworkTransform {
  /** Target camera position in 3D world space */
  targetPosition: [number, number, number] | THREE.Vector3;
  /** Target camera look-at vector / focus point in 3D world space */
  targetLookAt: [number, number, number] | THREE.Vector3;
  /** Optional unique identifier of the artwork */
  artworkId?: string;
  /** Optional surface normal vector for backwards compatibility */
  normal?: [number, number, number] | THREE.Vector3;
  /** Optional inspection distance */
  distance?: number;
  /** Optional calculated camera offset along the wall normal */
  cameraOffset?: [number, number, number] | THREE.Vector3;
  /** Optional center position alias for backwards compatibility */
  position?: [number, number, number] | THREE.Vector3;
  /** Optional lookAt alias for backwards compatibility */
  lookAt?: [number, number, number] | THREE.Vector3;
}

export type InspectTarget = ActiveArtworkTransform;

export type NavigationMode = 'scroll' | 'freeroam';

export interface GalleryState {
  /**
   * Navigation mode determining how the user traverses the gallery.
   * 'scroll': Scrollytelling along the defined CatmullRom splines via virtual scroll track.
   * 'freeroam': First-person freeroam movement via PointerLockControls and WASD/arrow keys.
   * Defaults to 'freeroam'.
   */
  navigationMode: NavigationMode;
  setNavigationMode: (
    mode?: NavigationMode | ((prev: NavigationMode) => NavigationMode)
  ) => void;
  toggleNavigationMode?: () => void;

  /**
   * Scrollytelling normalized progression t in [0, 1].
   * Driven by GSAP ScrollTrigger along the virtual scroll track.
   * Frame-rate critical consumers read this transiently via getState().
   */
  scrollProgress: number;
  setScrollProgress: (scrollProgress: number) => void;

  /**
   * Pointer lock capture status flag when in freeroam mode.
   * True when browser pointer lock is captured and OS cursor is hidden.
   */
  isPointerLocked: boolean;
  setIsPointerLocked: (isPointerLocked: boolean) => void;

  /**
   * Inspection mode toggle flag.
   * When true, camera spline progression pauses and lerps to activeArtworkTransform.
   */
  isInspecting: boolean;
  setIsInspecting: (isInspecting: boolean) => void;

  /**
   * Object holding the target camera position and lookAt vector.
   */
  activeArtworkTransform: ActiveArtworkTransform | null;
  setActiveArtworkTransform: (
    activeArtworkTransform: ActiveArtworkTransform | null
  ) => void;

  /** Alias for inspectTarget for backwards compatibility */
  inspectTarget: ActiveArtworkTransform | null;
  setInspectTarget: (target: ActiveArtworkTransform | null) => void;

  /**
   * Convenience action to initiate artwork inspection.
   */
  enterInspection: (transform: ActiveArtworkTransform) => void;

  /**
   * Convenience action to exit artwork inspection and resume spline path.
   */
  exitInspection: () => void;

  /**
   * Active artwork ID under focus or hover.
   */
  activeArtworkId: string | null;
  setActiveArtworkId: (id: string | null) => void;
}

/**
 * useGalleryStore provides transient Zustand state decoupled from React render loops.
 * Complies with 02-performance-mandates.md and 03-camera-navigation.md.
 * Persist middleware is deliberately omitted.
 */
export const useGalleryStore = create<GalleryState>((set) => ({
  navigationMode: 'freeroam',
  setNavigationMode: (mode) =>
    set((state) => {
      if (typeof mode === 'function') {
        return { navigationMode: mode(state.navigationMode) };
      }
      if (mode !== undefined) {
        return { navigationMode: mode };
      }
      return {
        navigationMode:
          state.navigationMode === 'freeroam' ? 'scroll' : 'freeroam',
      };
    }),
  toggleNavigationMode: () =>
    set((state) => ({
      navigationMode:
        state.navigationMode === 'freeroam' ? 'scroll' : 'freeroam',
    })),

  scrollProgress: 0,
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),

  isPointerLocked: false,
  setIsPointerLocked: (isPointerLocked) => set({ isPointerLocked }),

  isInspecting: false,
  setIsInspecting: (isInspecting) => set({ isInspecting }),

  activeArtworkTransform: null,
  setActiveArtworkTransform: (activeArtworkTransform) =>
    set({
      activeArtworkTransform,
      inspectTarget: activeArtworkTransform,
    }),

  inspectTarget: null,
  setInspectTarget: (inspectTarget) =>
    set({
      inspectTarget,
      activeArtworkTransform: inspectTarget,
    }),

  enterInspection: (transform) =>
    set({
      isInspecting: true,
      activeArtworkTransform: transform,
      inspectTarget: transform,
      activeArtworkId: transform.artworkId ?? null,
    }),

  exitInspection: () =>
    set({
      isInspecting: false,
      activeArtworkTransform: null,
      inspectTarget: null,
    }),

  activeArtworkId: null,
  setActiveArtworkId: (activeArtworkId) => set({ activeArtworkId }),
}));

export default useGalleryStore;
