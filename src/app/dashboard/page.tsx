'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { GalleryCustomizer } from '@/components/dashboard/GalleryCustomizer';
import { ArtifactUploader } from '@/components/dashboard/ArtifactUploader';
import { MOCK_GALLERIES, MOCK_PROFILES, PRESET_CATALOG_ARTWORKS, WARSHIP_ARTWORK } from '@/lib/mockData';
import { Artwork, Gallery, Profile } from '@/lib/types';
import {
  getStoredGalleryData,
  saveStoredGalleryData,
  subscribeToGalleryUpdates,
} from '@/lib/galleryPersistence';
import { logout } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const defaultGallery = MOCK_GALLERIES['pragana-innovations'];
  const [profile, setProfile] = useState<Profile>(MOCK_PROFILES[0]);
  const [isDemoUser, setIsDemoUser] = useState(false);

  const [gallery, setGallery] = useState<Gallery>({
    id: defaultGallery.id,
    profile_id: defaultGallery.profile_id,
    template_id: defaultGallery.template_id,
    is_published: defaultGallery.is_published,
    custom_ambient_light_hex: defaultGallery.custom_ambient_light_hex,
    created_at: defaultGallery.created_at,
  });

  const [artworks, setArtworks] = useState<Artwork[]>(PRESET_CATALOG_ARTWORKS);

  const [slotMap, setSlotMap] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    defaultGallery.slots.forEach((s) => {
      map[s.slot_identifier] = s.artwork_id;
    });
    return map;
  });

  const [saveStatus, setSaveStatus] = useState<string>('Synced');
  const [isHydrated, setIsHydrated] = useState(false);

  // Authenticate session and load cloud/local profile on mount
  useEffect(() => {
    async function initUserAndGallery() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let activeUsername = MOCK_PROFILES[0].username;

        if (user) {
          setIsDemoUser(false);
          // Fetch authenticated profile from database
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (dbProfile) {
            setProfile(dbProfile);
            activeUsername = dbProfile.username;
          } else {
            const fallbackProfile: Profile = {
              id: user.id,
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'curator',
              display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Curator',
              bio: 'Curator at Imagini Digital Museum',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              created_at: new Date().toISOString(),
            };
            setProfile(fallbackProfile);
            activeUsername = fallbackProfile.username;
          }

          // Fetch cloud artworks for this user
          const { data: cloudArtworks } = await supabase
            .from('artworks')
            .select('*')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false });

          if (cloudArtworks && cloudArtworks.length > 0) {
            setArtworks((prev) => {
              const combined = [...cloudArtworks, ...prev];
              return Array.from(new Map(combined.map((a) => [a.id, a])).values());
            });
          }
        } else {
          setIsDemoUser(true);
          // Check if custom demo profile was saved from registration or preview
          try {
            const savedProfileStr = localStorage.getItem('pragana_active_profile');
            if (savedProfileStr) {
              const savedProfile = JSON.parse(savedProfileStr);
              if (savedProfile && savedProfile.username) {
                setProfile(savedProfile);
                activeUsername = savedProfile.username;
              }
            }
          } catch {
            // Retain default mock profile
          }
        }

        // Load from persistent localStorage
        const stored = getStoredGalleryData(activeUsername);
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
        }
      } catch (err) {
        console.warn('Session init warning:', err);
        setIsDemoUser(true);
      } finally {
        setIsHydrated(true);
      }
    }

    initUserAndGallery();
  }, []);

  // Subscribe to cross-tab updates for current profile username
  useEffect(() => {
    const unsubscribe = subscribeToGalleryUpdates(profile.username, (data) => {
      if (data.gallery) setGallery((prev) => ({ ...prev, ...data.gallery }));
      if (data.artworks) setArtworks(data.artworks);
      if (data.slotMap) setSlotMap((prev) => ({ ...prev, ...data.slotMap }));
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
    });

    setTimeout(() => setSaveStatus('Synced to 3D Viewport'), 300);
  };

  const handleManualSync = () => {
    setSaveStatus('Syncing...');
    saveStoredGalleryData(profile.username, {
      gallery,
      artworks,
      slotMap,
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {profile.display_name}
                </h1>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                  @{profile.username}
                </span>
                {isDemoUser && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1.5" title="Local session (unauthenticated)">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Demo Session
                  </span>
                )}
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
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
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-mono transition-colors flex items-center gap-1.5"
              title="Force sync local catalog and slot mappings"
            >
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Sync Viewport</span>
            </button>

            {/* <button
              onClick={() => {
                const el = document.getElementById('artifact-uploader');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload Artwork</span>
            </button> */}

            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs border border-white/10 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
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
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
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
            <div className="text-[11px] font-mono text-slate-400 uppercase">Catalog Size</div>
            <div className="text-2xl font-bold text-white mt-1">{artworks.length} Artifacts</div>
            <div className="text-[10px] text-cyan-400 font-mono mt-2">Ready for mounting</div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Mounted Bays</div>
            <div className="text-2xl font-bold text-white mt-1">{assignedCount} / 6 Active</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-2">Corridors populated</div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Rendering Engine</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">60.0 FPS</div>
            <div className="text-[10px] text-slate-400 font-mono mt-2">&lt; 50 draw calls per room</div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Realtime Sync</div>
            <div className="text-2xl font-bold text-cyan-300 mt-1">Active</div>
            <div className="text-[10px] text-slate-400 font-mono mt-2">Auto-synced to 3D Viewport</div>
          </div>
        </div>

        {/* Gallery Customization & Visual Slot Mapping Interface */}
        <div className="mb-8">
          <GalleryCustomizer
            gallery={gallery}
            username={profile.username}
            artworks={artworks}
            slotMap={slotMap}
            onUpdateGallery={handleUpdateGallery}
            onAssignSlot={handleAssignSlot}
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
