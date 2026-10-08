'use client';

import React from 'react';
import { useGalleryStore } from '@/store/useGalleryStore';

export function ReticleOverlay() {
  const navigationMode = useGalleryStore((s) => s.navigationMode);
  const isPointerLocked = useGalleryStore((s) => s.isPointerLocked);
  const isInspecting = useGalleryStore((s) => s.isInspecting);
  const activeArtworkId = useGalleryStore((s) => s.activeArtworkId);

  // Only render during freeroam navigation when not inspecting an artwork
  if (navigationMode !== 'freeroam' || isInspecting) {
    return null;
  }

  const isAimingAtArtwork = Boolean(activeArtworkId);

  return (
    <>
      {/* 
        1. Central Aiming Reticle (Fixed viewport center):
        Provides clear aiming reference when pointer lock is active,
        and subtle targeting crosshair when freely moving.
      */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center justify-center transition-transform duration-150"
        data-testid="gallery-reticle"
        aria-hidden="true"
      >
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <div
            className={`rounded-full border transition-all duration-200 ${
              isAimingAtArtwork
                ? 'w-10 h-10 border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110'
                : isPointerLocked
                ? 'w-7 h-7 border-white/50 bg-white/5'
                : 'w-6 h-6 border-white/30 bg-black/10'
            }`}
          />

          {/* Precision Center Dot */}
          <div
            className={`absolute rounded-full transition-all duration-150 ${
              isAimingAtArtwork
                ? 'w-2 h-2 bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,1)]'
                : isPointerLocked
                ? 'w-1.5 h-1.5 bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)]'
                : 'w-1 h-1 bg-white/70'
            }`}
          />

          {/* Subtle crosshair hairline notches when pointer locked */}
          {isPointerLocked && !isAimingAtArtwork && (
            <>
              <div className="absolute -top-2 w-[1px] h-1.5 bg-white/40" />
              <div className="absolute -bottom-2 w-[1px] h-1.5 bg-white/40" />
              <div className="absolute -left-2 h-[1px] w-1.5 bg-white/40" />
              <div className="absolute -right-2 h-[1px] w-1.5 bg-white/40" />
            </>
          )}
        </div>

        {/* Dynamic target inspection prompt */}
        {isAimingAtArtwork && (
          <div className="mt-4 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 backdrop-blur-md shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <span className="text-[11px] font-mono text-cyan-200 font-medium tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Click to Inspect Artwork
            </span>
          </div>
        )}
      </div>

      {/* 
        2. Bottom Status & Control Prompt:
        Informs the user of their current cursor mode and how to release / capture it.
      */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
        <div
          className={`backdrop-blur-md border px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl transition-all duration-300 text-xs font-mono ${
            isPointerLocked
              ? 'bg-black/70 border-emerald-500/30 text-slate-200'
              : 'bg-black/80 border-cyan-500/30 text-cyan-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isPointerLocked
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-cyan-400'
            }`}
          />
          {isPointerLocked ? (
            <span>
              Looking Mode Active &bull; Press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-semibold border border-white/20">
                ESC
              </kbd>{' '}
              to release cursor &bull; WASD to move
            </span>
          ) : (
            <span>
              Click canvas to lock mouse &bull; Drag to rotate &bull; WASD to walk
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export default ReticleOverlay;
