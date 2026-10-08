'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { Gallery, Artwork, SlotConfiguration } from '@/lib/types';
import { GALLERY_SLOT_CONFIGS } from '@/lib/mockData';
import { saveGalleryCustomization, upsertGallerySlotAction } from '@/lib/actions/gallery';

export interface GalleryCustomizerProps {
  gallery: Gallery;
  username: string;
  artworks: Artwork[];
  slotMap: Record<string, string | null>;
  onUpdateGallery: (updated: Partial<Gallery>) => void;
  onAssignSlot: (slotIdentifier: string, artworkId: string | null) => void;
}

const ARCHITECTURAL_TEMPLATES = [
  {
    id: 'minimalist-cube-v1',
    name: 'Minimalist Cube V1',
    tag: 'Dark Obsidian',
    description: 'Polished concrete floors and dark obsidian acoustic walls for focused contemplation.',
  },
  {
    id: 'brutalist-atrium-v1',
    name: 'Brutalist Atrium V1',
    tag: 'Monolithic Concrete',
    description: 'Monolithic concrete pillars, double-height ceiling voids, and directional shadows.',
  },
  {
    id: 'solarium-rotunda-v1',
    name: 'Solarium Rotunda V1',
    tag: 'Luminous Skylight',
    description: 'Expansive overhead glass grids, warm terrazzo stone, and diffused daylight bouncing.',
  },
];

const WALL_MATERIALS = [
  { id: 'minimal-white', name: 'Minimalist White Stucco' },
  { id: 'raw-concrete', name: 'Architectural Raw Concrete' },
  { id: 'dark-slate', name: 'Matte Obsidian Slate' },
  { id: 'sandstone', name: 'Luminous Warm Sandstone' },
];

const FLOOR_MATERIALS = [
  { id: 'polished-concrete', name: 'Polished Terrazzo Concrete' },
  { id: 'hardwood-oak', name: 'Herringbone Hardwood Oak' },
  { id: 'dark-terrazzo', name: 'Basalt Dark Terrazzo' },
  { id: 'marble-tile', name: 'Carrara Polished Marble' },
];

const AMBIENT_PRESETS = [
  { label: 'Museum Daylight', hex: '#ffffff' },
  { label: 'Cool Xenon', hex: '#e0f2fe' },
  { label: 'Warm Quartz', hex: '#fff7ed' },
  { label: 'Deep Basalt', hex: '#1e293b' },
  { label: 'Atmospheric Violet', hex: '#312e81' },
];

export function GalleryCustomizer({
  gallery,
  username,
  artworks,
  slotMap,
  onUpdateGallery,
  onAssignSlot,
}: GalleryCustomizerProps) {
  // Local environment control state
  const [templateId, setTemplateId] = useState<string>(
    gallery.template_id || 'minimalist-cube-v1'
  );
  const [ambientLightHex, setAmbientLightHex] = useState<string>(
    gallery.custom_ambient_light_hex || '#ffffff'
  );
  const [wallMaterial, setWallMaterial] = useState<string>(
    gallery.wall_texture_id || gallery.interior_config?.wall_material_id || 'minimal-white'
  );
  const [floorMaterial, setFloorMaterial] = useState<string>(
    gallery.floor_texture_id || gallery.interior_config?.floor_material_id || 'polished-concrete'
  );
  const [isPublished, setIsPublished] = useState<boolean>(
    Boolean(gallery.is_published)
  );

  // Slot modal picker state
  const [activeSlotModal, setActiveSlotModal] = useState<SlotConfiguration | null>(null);
  const [modalSearch, setModalSearch] = useState<string>('');

  // Sync Action states
  const [isSyncing, startSyncTransition] = useTransition();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Live update handlers
  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateId(newTemplateId);
    onUpdateGallery({ template_id: newTemplateId });
  };

  const handleAmbientLightChange = (hex: string) => {
    setAmbientLightHex(hex);
    onUpdateGallery({ custom_ambient_light_hex: hex });
  };

  const handleWallMaterialChange = (mat: string) => {
    setWallMaterial(mat);
    onUpdateGallery({
      wall_texture_id: mat,
      interior_config: {
        ...(gallery.interior_config || {
          ceiling_type: 'recessed-spotlight',
          frames: [],
          floor_material_id: floorMaterial,
        }),
        wall_material_id: mat,
      },
    });
  };

  const handleFloorMaterialChange = (mat: string) => {
    setFloorMaterial(mat);
    onUpdateGallery({
      floor_texture_id: mat,
      interior_config: {
        ...(gallery.interior_config || {
          ceiling_type: 'recessed-spotlight',
          frames: [],
          wall_material_id: wallMaterial,
        }),
        floor_material_id: mat,
      },
    });
  };

  const handlePublishToggle = () => {
    const nextPublished = !isPublished;
    setIsPublished(nextPublished);
    onUpdateGallery({ is_published: nextPublished });
  };

  // Slot modal selection handler with Supabase upsert
  const handleSelectArtworkForSlot = async (artworkId: string | null) => {
    if (!activeSlotModal) return;

    const slotId = activeSlotModal.identifier;
    onAssignSlot(slotId, artworkId);

    // Call Server Action to upsert gallery_slots record
    try {
      await upsertGallerySlotAction(gallery.id, slotId, artworkId, username);
      setSyncStatus(`Mounted on ${slotId.toUpperCase()}`);
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      console.warn('Slot upsert notice:', err);
    }

    setActiveSlotModal(null);
    setModalSearch('');
  };

  // Save Changes Sync Action triggering Server Action
  const handleSaveChanges = () => {
    setSyncError(null);
    setSyncStatus('Syncing changes to database...');

    startSyncTransition(async () => {
      try {
        const result = await saveGalleryCustomization({
          galleryId: gallery.id,
          profileId: gallery.profile_id,
          username,
          templateId,
          customAmbientLightHex: ambientLightHex,
          wallMaterial,
          floorMaterial,
          isPublished,
          slotMap,
        });

        if (result.error) {
          setSyncError(result.error);
          setSyncStatus(null);
        } else {
          setSyncStatus('Changes Saved & Live Viewport Synced!');
          setTimeout(() => setSyncStatus(null), 4000);
        }
      } catch (err: any) {
        setSyncError(err?.message || 'Failed to save changes');
        setSyncStatus(null);
      }
    });
  };

  // Filter artworks for modal picker
  const filteredModalArtworks = useMemo(() => {
    if (!modalSearch.trim()) return artworks;
    const query = modalSearch.toLowerCase();
    return artworks.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        (a.description && a.description.toLowerCase().includes(query))
    );
  }, [artworks, modalSearch]);

  return (
    <div className="space-y-8">
      {/* 
        ========================================================================
        1. SPATIAL ENVIRONMENT CONTROLS & SYNC ACTION HEADER
        ========================================================================
      */}
      <div className="bg-[#0b101d]/90 border border-white/10 rounded-2xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/4 w-96 h-48 bg-indigo-500/10 blur-3xl rounded-full"
          aria-hidden="true"
        />

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 pb-6 border-b border-white/5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono tracking-widest text-cyan-400 uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Spatial Environment &amp; Customization</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Gallery Architecture &amp; Slot Customizer
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Configure your 3D spatial template, photometric ambient lighting, surface materials, and assign catalog artworks to physical corridor bays.
            </p>
          </div>

          {/* Sync Action and Viewport Links */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/${username}`}
              target="_blank"
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <span>Preview 3D</span>
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            {/* Save Changes Button triggering Server Action */}
            <button
              onClick={handleSaveChanges}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-cyan-500 hover:from-cyan-400 hover:via-indigo-500 hover:to-cyan-400 text-white font-mono text-xs font-bold tracking-wider uppercase shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync Status Feedback Alerts */}
        {syncStatus && (
          <div
            role="status"
            className="mb-6 p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 animate-fadeIn font-mono"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{syncStatus}</span>
          </div>
        )}

        {syncError && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 font-mono"
          >
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{syncError}</span>
          </div>
        )}

        {/* Spatial Architecture Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Architectural Template Selectors */}
          <div className="lg:col-span-7 space-y-3.5">
            <label className="block text-xs font-mono tracking-wider text-slate-300 uppercase">
              3D Architectural Template (template_id)
            </label>
            <div className="grid grid-cols-1 gap-3">
              {ARCHITECTURAL_TEMPLATES.map((tmpl) => {
                const isSelected = templateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-[#070b15]/60 border-white/5 hover:border-white/15 hover:bg-[#070b15]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-slate-950" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                          {tmpl.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Lighting, Materials, and Publication Toggle */}
          <div className="lg:col-span-5 space-y-6">
            {/* Ambient Lighting Color Picker with Live Hex */}
            <div className="bg-[#070b15]/60 border border-white/5 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-mono tracking-wider text-slate-300 uppercase">
                Custom Ambient Light (custom_ambient_light_hex)
              </label>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={ambientLightHex}
                    onChange={(e) => handleAmbientLightChange(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border border-white/20 p-1"
                    title="Choose photometric ambient light color"
                  />
                </div>

                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                    #
                  </span>
                  <input
                    type="text"
                    value={ambientLightHex.replace(/^#/, '')}
                    onChange={(e) => {
                      const val = `#${e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)}`;
                      handleAmbientLightChange(val);
                    }}
                    placeholder="ffffff"
                    maxLength={7}
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400 uppercase"
                  />
                </div>

                <div
                  className="w-10 h-10 rounded-xl border border-white/10 shrink-0 shadow-inner"
                  style={{ backgroundColor: ambientLightHex }}
                  title={`Active Photometric Color: ${ambientLightHex}`}
                />
              </div>

              {/* Quick Preset Swatches */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[10px] font-mono text-slate-500">Presets:</span>
                {AMBIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handleAmbientLightChange(preset.hex)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1.5 ${
                      ambientLightHex.toLowerCase() === preset.hex.toLowerCase()
                        ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wall & Floor Material Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-1.5">
                  Wall Material
                </label>
                <select
                  value={wallMaterial}
                  onChange={(e) => handleWallMaterialChange(e.target.value)}
                  className="w-full bg-[#070b15] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  {WALL_MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono tracking-wider text-slate-300 uppercase mb-1.5">
                  Floor Material
                </label>
                <select
                  value={floorMaterial}
                  onChange={(e) => handleFloorMaterialChange(e.target.value)}
                  className="w-full bg-[#070b15] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  {FLOOR_MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Public Status Toggle Switch */}
            <div className="bg-[#070b15]/60 border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Public Exhibition
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isPublished
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    }`}
                  >
                    {isPublished ? 'Published' : 'Draft / Private'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isPublished
                    ? 'Visible to world visitors on the public 3D URL.'
                    : 'Restricted to authenticated curator session.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePublishToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isPublished ? 'bg-cyan-500' : 'bg-slate-800 border border-white/10'
                }`}
                role="switch"
                aria-checked={isPublished}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublished ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. VISUAL SLOT ASSIGNMENT GRID (6 ARCHITECTURAL BAYS)
        ========================================================================
      */}
      <div className="bg-[#0b101d]/90 border border-white/10 rounded-2xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white tracking-tight">
                3D Gallery Corridor Slot Mapping
              </h3>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                6 Physical Bays
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Click any bay to mount an uploaded artifact or unmount an existing piece. Maps directly to the 3D WebGL corridor.
            </p>
          </div>
        </div>

        {/* 6-Bay Visual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {GALLERY_SLOT_CONFIGS.map((slot: SlotConfiguration) => {
            const assignedArtworkId = slotMap[slot.identifier] ?? null;
            const assignedArtwork = artworks.find((a) => a.id === assignedArtworkId);

            return (
              <div
                key={slot.identifier}
                className={`bg-[#070b15]/90 border rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all duration-200 group ${
                  assignedArtwork
                    ? 'border-cyan-500/30 hover:border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header: Slot Identifier and Physical Dimension */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                      {slot.identifier.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-white/5">
                    {slot.size[0]}m &times; {slot.size[1]}m
                  </span>
                </div>

                {/* Slot Preview Thumbnail Card */}
                <div
                  onClick={() => setActiveSlotModal(slot)}
                  className="w-full h-36 rounded-xl bg-slate-950 border border-white/10 overflow-hidden flex items-center justify-center relative cursor-pointer group-hover:scale-[1.01] transition-transform"
                >
                  {assignedArtwork && assignedArtwork.storage_url ? (
                    <>
                      <img
                        src={assignedArtwork.storage_url}
                        alt={assignedArtwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                        <span className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-mono text-[11px] font-bold shadow-lg">
                          Change Artwork
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-cyan-400 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-mono font-semibold">
                        + Mount Artwork to Bay
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Assigned Title & Quick Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {assignedArtwork ? assignedArtwork.title : 'Unassigned Bay'}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      {assignedArtwork ? 'Mounted in 3D scene' : 'Ready for asset mounting'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveSlotModal(slot)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
                      title="Select or change artwork"
                    >
                      {assignedArtwork ? 'Switch' : 'Mount'}
                    </button>

                    {assignedArtwork && (
                      <button
                        type="button"
                        onClick={() => handleSelectArtworkForSlot(null)}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 text-[11px] font-mono transition-colors"
                        title="Unmount artwork from this bay"
                      >
                        Unmount
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 
        ========================================================================
        3. MODAL PICKER FOR MOUNTING CATALOG ARTWORKS
        ========================================================================
      */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b101d] border border-white/10 rounded-2xl p-6 sm:p-7 max-w-2xl w-full text-white shadow-2xl relative max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h3 className="text-base font-bold text-white">
                    Mount Artwork to {activeSlotModal.identifier.toUpperCase()}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Bay Dimensions: {activeSlotModal.size[0]}m &times; {activeSlotModal.size[1]}m
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveSlotModal(null);
                  setModalSearch('');
                }}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Modal Search Bar & Unmount Option */}
            <div className="space-y-3 mb-4 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search catalog by title or narrative..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Quick Unmount Row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-mono">Leave bay empty / unassigned:</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectArtworkForSlot(null)}
                  className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/20 text-xs font-mono transition-colors"
                >
                  Clear / Unmount Bay
                </button>
              </div>
            </div>

            {/* Modal Artworks List */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
              {filteredModalArtworks.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  No matching artworks found in catalog.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredModalArtworks.map((art) => {
                    const isCurrentlySelected =
                      slotMap[activeSlotModal.identifier] === art.id;

                    return (
                      <div
                        key={art.id}
                        onClick={() => handleSelectArtworkForSlot(art.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 group ${
                          isCurrentlySelected
                            ? 'bg-cyan-950/40 border-cyan-400/70 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950/80 border-white/5 hover:border-cyan-500/40 hover:bg-slate-900'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-lg bg-slate-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                          {art.storage_url ? (
                            <img
                              src={art.storage_url}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 truncate">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                              {art.title}
                            </h4>
                            {isCurrentlySelected && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {art.description || 'No description'}
                          </p>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {isCurrentlySelected ? 'Currently Mounted' : 'Click to mount'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryCustomizer;
