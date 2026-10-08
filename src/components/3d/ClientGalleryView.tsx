'use client';

import { useEffect, useState } from 'react';
import { GalleryCanvas } from '@/components/3d/GalleryCanvas';
import { ArtworkPlacard } from '@/components/ui/ArtworkPlacard';
import { GalleryHUD } from '@/components/ui/GalleryHUD';
import { Artwork, GalleryWithArtworks } from '@/lib/types';
import {
  mergeGalleryWithStorage,
  subscribeToGalleryUpdates,
} from '@/lib/galleryPersistence';

interface ClientGalleryViewProps {
  initialGallery: GalleryWithArtworks;
  username: string;
}

export function ClientGalleryView({
  initialGallery,
  username,
}: ClientGalleryViewProps) {
  const [gallery, setGallery] = useState<GalleryWithArtworks>(initialGallery);

  // Synchronize on mount and listen to live updates from dashboard
  useEffect(() => {
    // 1. Overlay any locally stored/assigned assets
    const merged = mergeGalleryWithStorage(initialGallery, username);
    setGallery(merged);

    // 2. Subscribe to real-time storage & cross-tab events from Dashboard
    const unsubscribe = subscribeToGalleryUpdates(username, () => {
      const updated = mergeGalleryWithStorage(initialGallery, username);
      setGallery(updated);
    });

    return unsubscribe;
  }, [initialGallery, username]);

  // Extract non-null artworks dynamically
  const mountedArtworks = gallery.slots
    .map((slot) => slot.artwork)
    .filter((art): art is Artwork => art !== null && art !== undefined);

  return (
    <div className="relative w-full min-h-screen bg-[#05070c] overflow-x-hidden">
      {/* 
        3D Render Layer (React Three Fiber):
        Isolated fixed viewport (z-0) to prevent DOM layout thrashing (01-project-overview.md)
      */}
      <GalleryCanvas
        gallery={gallery}
        profile={gallery?.profile}
        custom_ambient_light_hex={gallery?.custom_ambient_light_hex}
        template_id={gallery?.template_id}
        slots={gallery?.slots}
      />

      {/* 
        Tailwind 2D DOM Overlays:
        HUD controls and dynamic curatorial inspection placard (z-30 / z-40)
      */}
      <GalleryHUD
        title={gallery.profile.display_name || `${username}'s Gallery`}
        artistName={gallery.profile.display_name || username}
      />

      <ArtworkPlacard
        artworks={mountedArtworks}
        artistName={gallery.profile.display_name || username}
      />
    </div>
  );
}

export default ClientGalleryView;
