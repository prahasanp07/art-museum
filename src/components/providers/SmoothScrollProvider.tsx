'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useGalleryStore } from '@/store/useGalleryStore';

// Register GSAP plugins safely on client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface SmoothScrollContextValue {
  lenis: Lenis | null;
  scrollTo: (
    target: number | string | HTMLElement,
    options?: Parameters<Lenis['scrollTo']>[1]
  ) => void;
  stop: () => void;
  start: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export interface SmoothScrollProviderProps {
  children?: ReactNode;
  /**
   * Tailwind class or CSS height specifying the virtual scroll track depth.
   * Defaults to 'h-[500vh]' as mandated in 03-camera-navigation.md.
   */
  trackHeightClass?: string;
  /**
   * Whether to mount the virtual scroll bridge track container.
   * Defaults to true on dynamic 3D gallery routes, or when explicitly enabled.
   */
  enableTrack?: boolean;
  /**
   * Additional wrapper class names.
   */
  className?: string;
}

/**
 * SmoothScrollProvider implements the exact Animation Engine and Scroll Bridge contracts:
 * 1. Lenis initialized with `autoRaf: false`.
 * 2. GSAP ticker drives the Lenis animation frame directly (`gsap.ticker.add`).
 * 3. GSAP lag smoothing disabled (`gsap.ticker.lagSmoothing(0)`) to eliminate camera positional snapping.
 * 4. Hidden container (`h-[500vh]`) provides the physical scrollbar track.
 * 5. GSAP `ScrollTrigger` listens to this track and updates `scrollProgress` in `useGalleryStore`
 *    without triggering DOM re-renders.
 */
function PathnameTracker({
  onPathChange,
}: {
  onPathChange: (path: string) => void;
}) {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) {
      onPathChange(pathname);
    }
  }, [pathname, onPathChange]);
  return null;
}

export function SmoothScrollProvider({
  children,
  trackHeightClass = 'h-[500vh]',
  enableTrack,
  className = '',
}: SmoothScrollProviderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [shouldMountTrack, setShouldMountTrack] = useState<boolean>(enableTrack ?? false);

  useEffect(() => {
    if (enableTrack !== undefined) {
      setShouldMountTrack(enableTrack);
      return;
    }
    const path =
      currentPath ||
      (typeof window !== 'undefined' ? window.location.pathname : '');

    const isGallery =
      Boolean(path) &&
      path !== '/' &&
      path !== '/login' &&
      path !== '/register' &&
      !path.startsWith('/dashboard') &&
      !path.startsWith('/api');

    setShouldMountTrack(isGallery);
  }, [enableTrack, currentPath]);

  const [contextValue, setContextValue] = useState<SmoothScrollContextValue>({
    lenis: null,
    scrollTo: () => {},
    stop: () => {},
    start: () => {},
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initialize Lenis with manual RAF control (autoRaf: false)
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    // 2. Disable GSAP lag smoothing to eliminate positional snapping (03-camera-navigation.md)
    gsap.ticker.lagSmoothing(0);

    // 3. Drive Lenis animation frame directly from GSAP ticker
    const updateTicker = (time: number) => {
      // GSAP ticker time is in seconds; Lenis raf expects milliseconds
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);

    // 4. Connect Lenis scroll event to ScrollTrigger updates
    const onLenisScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on('scroll', onLenisScroll);

    // 5. Scroll Bridge: Hidden container track monitored by ScrollTrigger
    // Updates scrollProgress in useGalleryStore directly without triggering DOM re-renders
    let trigger: ScrollTrigger | null = null;
    if (shouldMountTrack && trackRef.current) {
      trigger = ScrollTrigger.create({
        trigger: trackRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          // Transient store update: zero React DOM re-renders triggered
          useGalleryStore.getState().setScrollProgress(self.progress);
        },
      });
    }

    // 6. Inspection Mode synchronization: pause scroll when inspecting an artwork
    const unsubscribeStore = useGalleryStore.subscribe((state, prevState) => {
      if (state.isInspecting !== prevState.isInspecting) {
        if (state.isInspecting) {
          lenis.stop();
        } else {
          lenis.start();
        }
      }
    });

    // Provide context methods for 2D UI navigation
    setContextValue({
      lenis,
      scrollTo: (target, options) => lenis.scrollTo(target, options),
      stop: () => lenis.stop(),
      start: () => lenis.start(),
    });

    // Force ScrollTrigger calculation
    ScrollTrigger.refresh();

    // Cleanup contract
    return () => {
      unsubscribeStore();
      lenis.off('scroll', onLenisScroll);
      gsap.ticker.remove(updateTicker);
      if (trigger) {
        trigger.kill();
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [shouldMountTrack]);

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      <Suspense fallback={null}>
        <PathnameTracker onPathChange={setCurrentPath} />
      </Suspense>
      <div className={`relative w-full ${className}`}>
        {/* Primary application / viewport children */}
        {children}

        {/*
          Scroll Bridge Track:
          Hidden container (h-[500vh]) providing the physical scrollbar track.
          Pointer-events disabled and invisible to prevent layout/interaction interference.
        */}
        {shouldMountTrack && (
          <div
            ref={trackRef}
            className={`pointer-events-none absolute top-0 left-0 w-full ${trackHeightClass} opacity-0 select-none -z-10`}
            aria-hidden="true"
            tabIndex={-1}
            data-testid="scroll-bridge-track"
          />
        )}
      </div>
    </SmoothScrollContext.Provider>
  );
}

export default SmoothScrollProvider;
