'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { GalleryCustomizer } from '@/components/dashboard/GalleryCustomizer';
import { ArtifactUploader } from '@/components/dashboard/ArtifactUploader';
import { Artwork, Gallery, Profile } from '@/lib/types';
import {
  getStoredGalleryData,
  saveStoredGalleryData,
  subscribeToGalleryUpdates,
} from '@/lib/galleryPersistence';
import { logout } from '@/lib/actions/auth';

export interface DashboardClientProps {
  initialProfile: Profile;
  initialGallery: Gallery;
  initialArtworks: Artwork[];
  initialSlotMap: Record<string, string | null>;
  initialIsDemoUser: boolean;
}

export function DashboardClient({
  initialProfile,
  initialGallery,
  initialArtworks,
  initialSlotMap,
  initialIsDemoUser,
}: DashboardClientProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(initialIsDemoUser);
  const [gallery, setGallery] = useState<Gallery>(initialGallery);
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [slotMap, setSlotMap] = useState<Record<string, string | null>>(initialSlotMap);
  const [frameMap, setFrameMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (initialGallery.interior_config?.frames) {
      initialGallery.interior_config.frames.forEach((f) => {
        if (f.slot_identifier) {
          initial[f.slot_identifier] = f.frame_glb_id;
        }
      });
    }
    return initial;
  });
  const [frameDesignMap, setFrameDesignMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (initialGallery.interior_config?.frames) {
      initialGallery.interior_config.frames.forEach((f) => {
        if (f.slot_identifier && f.frame_design_id) {
          initial[f.slot_identifier] = f.frame_design_id;
        }
      });
    }
    return initial;
  });
  const [saveStatus, setSaveStatus] = useState<string>('Synced');

  // Load any local unsynced edits on mount without overriding authenticated profile
  useEffect(() => {
    // Only if unauthenticated demo session, check if custom demo profile exists
    if (initialIsDemoUser) {
      try {
        const savedProfileStr = localStorage.getItem('pragana_active_profile');
        if (savedProfileStr) {
          const savedProfile = JSON.parse(savedProfileStr);
          if (savedProfile && savedProfile.username) {
            setProfile(savedProfile);
          }
        }
      } catch {
        // Retain default demo profile
      }
    }

    // Load local storage overrides for artworks, slots, frames, and gallery customization
    const stored = getStoredGalleryData(initialProfile.username);
    if (stored) {
      if (stored.gallery) {
        setGallery((prev) => ({ ...prev, ...stored.gallery }));
      }
      if (Array.isArray(stored.artworks) && stored.artworks.length > 0) {
        setArtworks((prev) => {
          const combined = [...stored.artworks!, ...prev];
          return Array.from(new Map(combined.map((a) => [a.id, a])).values());
        });
      }
      if (stored.slotMap) {
        setSlotMap((prev) => ({ ...prev, ...stored.slotMap }));
      }
      if (stored.frameMap) {
        setFrameMap((prev) => ({ ...prev, ...stored.frameMap }));
      }
      if (stored.frameDesignMap) {
        setFrameDesignMap((prev) => ({ ...prev, ...stored.frameDesignMap }));
      }
    }
  }, [initialIsDemoUser, initialProfile.username]);

  // Subscribe to cross-tab updates for current profile username
  useEffect(() => {
    const unsubscribe = subscribeToGalleryUpdates(profile.username, (data) => {
      if (data.gallery) setGallery((prev) => ({ ...prev, ...data.gallery }));
      if (data.artworks) setArtworks(data.artworks);
      if (data.slotMap) setSlotMap((prev) => ({ ...prev, ...data.slotMap }));
      if (data.frameMap) setFrameMap((prev) => ({ ...prev, ...data.frameMap }));
      if (data.frameDesignMap) setFrameDesignMap((prev) => ({ ...prev, ...data.frameDesignMap }));
    });

    return unsubscribe;
  }, [profile.username]);

  const handleAssignSlot = (slotIdentifier: string, artworkId: string | null) => {
    const updatedSlotMap = {
      ...slotMap,
      [slotIdentifier]: artworkId,
    };
    setSlotMap(updatedSlotMap);
    setSaveStatus('Saving...');

    saveStoredGalleryData(profile.username, {
      gallery,
      artworks,
      slotMap: updatedSlotMap,
      frameMap,
      frameDesignMap,
    });

    setTimeout(() => setSaveStatus('Synced to 3D Viewport'), 300);
  };

  const handleAssignFrame = (slotIdentifier: string, frameId: string) => {
    const updatedFrameMap = {
      ...frameMap,
      [slotIdentifier]: frameId,
    };
    setFrameMap(updatedFrameMap);

    const existingFrames = gallery.interior_config?.frames || [];
    const otherFrames = existingFrames.filter((f) => f.slot_identifier !== slotIdentifier);
    const currentDesignId = frameDesignMap[slotIdentifier] || 'classic-box';
    const updatedFrames = [
      ...otherFrames,
      {
        slot_identifier: slotIdentifier,
        frame_glb_id: frameId,
        frame_design_id: currentDesignId,
      },
    ];

    const updatedGallery: Gallery = {
      ...gallery,
      interior_config: {
        ...(gallery.interior_config || {
          wall_material_id: 'minimal-white',
          floor_material_id: 'polished-concrete',
          ceiling_type: 'recessed-spotlight',
        }),
        frames: updatedFrames,
      },
    };
    setGallery(updatedGallery);
    setSaveStatus('Saving...');

    saveStoredGalleryData(profile.username, {
      gallery: updatedGallery,
      artworks,
      slotMap,
      frameMap: updatedFrameMap,
      frameDesignMap,
    });

    setTimeout(() => setSaveStatus('Synced to 3D Viewport'), 300);
  };

  const handleAssignFrameDesign = (slotIdentifier: string, designId: string) => {
    const updatedFrameDesignMap = {
      ...frameDesignMap,
      [slotIdentifier]: designId,
    };
    setFrameDesignMap(updatedFrameDesignMap);

    const existingFrames = gallery.interior_config?.frames || [];
    const otherFrames = existingFrames.filter((f) => f.slot_identifier !== slotIdentifier);
    const currentFrameGlbId = frameMap[slotIdentifier] || 'neo-chrome';
    const updatedFrames = [
      ...otherFrames,
      {
        slot_identifier: slotIdentifier,
        frame_glb_id: currentFrameGlbId,
        frame_design_id: designId,
      },
    ];

    const updatedGallery: Gallery = {
      ...gallery,
      interior_config: {
        ...(gallery.interior_config || {
          wall_material_id: 'minimal-white',
          floor_material_id: 'polished-concrete',
          ceiling_type: 'recessed-spotlight',
        }),
        frames: updatedFrames,
      },
    };
    setGallery(updatedGallery);
    setSaveStatus('Saving...');

    saveStoredGalleryData(profile.username, {
      gallery: updatedGallery,
      artworks,
      slotMap,
      frameMap,
      frameDesignMap: updatedFrameDesignMap,
    });

    setTimeout(() => setSaveStatus('Synced to 3D Viewport'), 300);
  };

  const handleUploadArtwork = (newArtwork: Artwork) => {
    const combined = [newArtwork, ...artworks];
    const unique = Array.from(new Map(combined.map((a) => [a.id, a])).values());
    setArtworks(unique);
    setSaveStatus('Saving...');

    saveStoredGalleryData(profile.username, {
      gallery,
      artworks: unique,
      slotMap,
      frameMap,
      frameDesignMap,
    });

    setTimeout(() => setSaveStatus('Synced to 3D Viewport'), 300);
  };

  const handleDeleteArtwork = (artworkId: string) => {
    const updatedArtworks = artworks.filter((a) => a.id !== artworkId);
    setArtworks(updatedArtworks);

    // Unassign from slotMap if this artwork was mounted on any bay
    const updatedSlotMap = { ...slotMap };
    let slotChanged = false;
    Object.keys(updatedSlotMap).forEach((slotId) => {
      if (updatedSlotMap[slotId] === artworkId) {
        updatedSlotMap[slotId] = null;
        slotChanged = true;
      }
    });
    if (slotChanged) {
      setSlotMap(updatedSlotMap);
    }

    setSaveStatus('Saving...');
    saveStoredGalleryData(profile.username, {
      gallery,
      artworks: updatedArtworks,
      slotMap: updatedSlotMap,
      frameMap,
      frameDesignMap,
    });

    setTimeout(() => setSaveStatus('Synced to 3D Viewport'), 300);
  };

  const handleUpdateGallery = (updated: Partial<Gallery>) => {
    const updatedGallery = { ...gallery, ...updated };
    setGallery(updatedGallery);
    setSaveStatus('Saving...');

    saveStoredGalleryData(profile.username, {
      gallery: updatedGallery,
      artworks,
      slotMap,
      frameMap,
      frameDesignMap,
    });

    setTimeout(() => setSaveStatus('Synced to 3D Viewport'), 300);
  };

  const handleManualSync = () => {
    setSaveStatus('Syncing...');
    saveStoredGalleryData(profile.username, {
      gallery,
      artworks,
      slotMap,
      frameMap,
      frameDesignMap,
    });
    setTimeout(() => setSaveStatus('Synced to 3D Viewport'), 400);
  };

  const assignedCount = Object.values(slotMap).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#05070c] text-white flex flex-col selection:bg-cyan-500 selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-32 pb-24">
        {/* Creator Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10 mb-8">
          <div className="flex items-center gap-5">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username || 'Curator avatar'}
                className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center font-bold text-white text-xl border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 uppercase shrink-0">
                {(profile.display_name || profile.username || 'C').charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {profile.display_name}
                </h1>
                <span className="text-xs font-mono text-slate-400 bg-slate-900/90 border border-white/10 px-2.5 py-0.5 rounded-md font-medium">
                  @{profile.username}
                </span>
                {isDemoUser && (
                  <span
                    className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1.5"
                    title="Local session (unauthenticated)"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Demo Session
                  </span>
                )}
                <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {saveStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {profile.bio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSync}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Force sync local catalog and slot mappings"
            >
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Sync Viewport</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('artifact-uploader');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload Artwork</span>
            </button>

            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs border border-white/10 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Visit 3D Hall</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <form action={logout}>
              <button
                type="submit"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    document.cookie = 'pragana_demo_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    localStorage.removeItem('pragana_active_profile');
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Log out of curator session"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>

        {/* Analytics & Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Catalog Size</div>
            <div className="text-2xl font-bold text-white mt-1">{artworks.length} Artifacts</div>
            <div className="text-[10px] text-cyan-400 font-medium mt-2">Ready for mounting</div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Mounted Bays</div>
            <div className="text-2xl font-bold text-white mt-1">{assignedCount} / 6 Active</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-2">Corridors populated</div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Rendering Engine</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">60.0 FPS</div>
            <div className="text-[10px] text-slate-400 font-medium mt-2">&lt; 50 draw calls per room</div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Realtime Sync</div>
            <div className="text-2xl font-bold text-cyan-300 mt-1">Active</div>
            <div className="text-[10px] text-slate-400 font-medium mt-2">Auto-synced to 3D Viewport</div>
          </div>
        </div>

        {/* Gallery Customization & Visual Slot Mapping Interface */}
        <div className="mb-8">
          <GalleryCustomizer
            gallery={gallery}
            username={profile.username}
            artworks={artworks}
            slotMap={slotMap}
            frameMap={frameMap}
            frameDesignMap={frameDesignMap}
            onUpdateGallery={handleUpdateGallery}
            onAssignSlot={handleAssignSlot}
            onAssignFrame={handleAssignFrame}
            onAssignFrameDesign={handleAssignFrameDesign}
          />
        </div>

        {/* Artifact Management Module: Drag-and-Drop Ingestion & 2D Grid */}
        <div id="artifact-uploader">
          <ArtifactUploader
            profileId={profile.id}
            artworks={artworks}
            slotMap={slotMap}
            onArtworkUploaded={handleUploadArtwork}
            onArtworkDeleted={handleDeleteArtwork}
          />
        </div>
      </main>
    </div>
  );
}

export default DashboardClient;
