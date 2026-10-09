'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGalleryStore } from '@/store/useGalleryStore';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';

interface GalleryHUDProps {
  title: string;
  artistName: string;
}

export function GalleryHUD({ title, artistName }: GalleryHUDProps) {
  const [progress, setProgress] = useState(0);
  const isInspecting = useGalleryStore((s) => s.isInspecting);
  const exitInspection = useGalleryStore((s) => s.exitInspection);
  const { lenis } = useSmoothScroll();

  // Subscribe to transient Zustand scroll updates for DOM HUD with requestAnimationFrame throttling
  useEffect(() => {
    let animId: number;
    const update = () => {
      const current = useGalleryStore.getState().scrollProgress;
      setProgress((prev) => (Math.abs(prev - current) > 0.002 ? current : prev));
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  const jumpToProgress = (targetProgress: number) => {
    if (isInspecting) {
      exitInspection();
    }
    if (lenis && lenis.limit) {
      lenis.scrollTo(targetProgress * lenis.limit, {
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }
  };

  const percentage = Math.round(progress * 100);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full">
        {/* Creator Identity Plaque */}
        <div className="pointer-events-auto backdrop-blur-md bg-black/50 border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-4 shadow-xl">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Exit to Directory</span>
          </Link>
          <div className="w-[1px] h-4 bg-white/20" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide">{title}</span>
            <span className="text-[10px] text-cyan-300 font-medium">Curated by {artistName}</span>
          </div>
        </div>

        {/* Right Status Indicator (Offset to accommodate Navigation Mode switch button) */}
        <div className="pointer-events-auto backdrop-blur-md bg-black/50 border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl mr-52">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">60 FPS WebGL Engine</span>
        </div>
      </div>


      {/* Bottom Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        {/* Corridor Quick-Jump Waypoints */}
        <div className="pointer-events-auto backdrop-blur-md bg-black/50 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl text-[11px] font-medium">
          <button
            onClick={() => jumpToProgress(0.0)}
            className={`px-3 py-1 rounded-full transition-colors ${
              progress < 0.25 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            01 Entrance
          </button>
          <button
            onClick={() => jumpToProgress(0.35)}
            className={`px-3 py-1 rounded-full transition-colors ${
              progress >= 0.25 && progress < 0.65 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            02 Wing A
          </button>
          <button
            onClick={() => jumpToProgress(0.70)}
            className={`px-3 py-1 rounded-full transition-colors ${
              progress >= 0.65 && progress < 0.88 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            03 Wing B
          </button>
          <button
            onClick={() => jumpToProgress(1.0)}
            className={`px-3 py-1 rounded-full transition-colors ${
              progress >= 0.88 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            04 Pavilion
          </button>
        </div>

        {/* Progress Bar & Instructions */}
        <div className="pointer-events-auto backdrop-blur-md bg-black/50 border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-slate-400 font-medium text-[11px]">DEPTH</span>
            <span className="font-bold text-cyan-400 font-mono">{percentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-slate-400 border-l border-white/10 pl-3">
            <span>Scroll to navigate</span>
            <span>&bull;</span>
            <span>Click art to inspect</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GalleryHUD;
