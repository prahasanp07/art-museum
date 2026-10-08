'use client';

import { useEffect } from 'react';
import { useGalleryStore } from '@/store/useGalleryStore';
import { Artwork } from '@/lib/types';

interface ArtworkPlacardProps {
  artworks: Artwork[];
  artistName: string;
}

/**
 * ArtworkPlacard renders a museum museum placard DOM overlay
 * when the user enters inspection mode (03-camera-navigation.md).
 */
export function ArtworkPlacard({ artworks, artistName }: ArtworkPlacardProps) {
  const isInspecting = useGalleryStore((s) => s.isInspecting);
  const activeArtworkTransform = useGalleryStore((s) => s.activeArtworkTransform);
  const exitInspection = useGalleryStore((s) => s.exitInspection);

  // Match inspected target to artwork metadata
  const currentArtwork = artworks.find(
    (art) => art.id === activeArtworkTransform?.artworkId
  );

  // Escape key dismiss listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInspecting) {
        exitInspection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspecting, exitInspection]);

  if (!isInspecting || !currentArtwork) return null;

  return (
    <div className="fixed bottom-8 right-8 z-40 max-w-md w-full animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="backdrop-blur-xl bg-slate-950/80 border border-white/15 p-6 rounded-2xl shadow-2xl text-white relative overflow-hidden group">
        {/* Glow Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-300">
              Inspection Mode &bull; 1.8m
            </span>
          </div>

          <button
            onClick={exitInspection}
            className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Press Escape to exit"
          >
            <span>Close</span>
            <kbd className="text-[10px] bg-black/40 px-1 py-0.5 rounded border border-white/10">
              ESC
            </kbd>
          </button>
        </div>

        {/* Artwork Info */}
        <h3 className="text-xl font-bold tracking-tight text-white mb-1">
          {currentArtwork.title}
        </h3>
        <p className="text-xs font-medium text-slate-400 mb-3">
          Created by <span className="text-slate-200">{artistName}</span>
        </p>

        {currentArtwork.description && (
          <p className="text-xs text-slate-300 leading-relaxed mb-5 line-clamp-4">
            {currentArtwork.description}
          </p>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/10">
          {currentArtwork.external_link ? (
            <a
              href={currentArtwork.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            >
              <span>View Provenance</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <span className="text-xs text-slate-500 font-mono">Original Artifact</span>
          )}

          <button
            onClick={exitInspection}
            className="text-xs font-medium px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors"
          >
            Resume Gallery Tour
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArtworkPlacard;
