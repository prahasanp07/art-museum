'use client';

import { Artwork, SlotConfiguration } from '@/lib/types';
import { GALLERY_SLOT_CONFIGS } from '@/lib/mockData';

interface SlotMappingFormProps {
  slots: Record<string, string | null>; // slot_identifier -> artwork_id
  artworks: Artwork[];
  onAssignSlot: (slotIdentifier: string, artworkId: string | null) => void;
}

export function SlotMappingForm({
  slots,
  artworks,
  onAssignSlot,
}: SlotMappingFormProps) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-white">3D Gallery Slot Mapping</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Link catalog artworks to physical 3D corridor bay positions
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
          6 Architectural Bays
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GALLERY_SLOT_CONFIGS.map((slot: SlotConfiguration) => {
          const assignedArtworkId = slots[slot.identifier] ?? null;
          const assignedArtwork = artworks.find((a) => a.id === assignedArtworkId);

          return (
            <div
              key={slot.identifier}
              className="bg-slate-950/80 border border-white/10 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  {slot.identifier}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {slot.size[0]}m &times; {slot.size[1]}m
                </span>
              </div>

              {/* Slot Preview Canvas Thumbnail */}
              <div className="w-full h-32 rounded-lg bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center relative group">
                {assignedArtwork && assignedArtwork.storage_url ? (
                  <img
                    src={assignedArtwork.storage_url}
                    alt={assignedArtwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-mono">Unassigned Bay</span>
                  </div>
                )}
              </div>

              {/* Artwork Select Dropdown */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Mounted Artwork
                </label>
                <select
                  id={`slot-select-${slot.identifier}`}
                  data-slot-id={slot.identifier}
                  value={assignedArtworkId || ''}
                  onChange={(e) =>
                    onAssignSlot(slot.identifier, e.target.value ? e.target.value : null)
                  }
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">(Empty Slot)</option>
                  {artworks.map((art, artIdx) => (
                    <option key={`${art.id}-${artIdx}`} value={art.id}>
                      {art.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SlotMappingForm;
