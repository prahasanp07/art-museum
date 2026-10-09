'use client';

import { Artwork, Gallery, GallerySlot, GalleryWithArtworks } from './types';
import { PRESET_CATALOG_ARTWORKS } from './mockData';

export interface StoredGalleryData {
  gallery?: Partial<Gallery>;
  artworks?: Artwork[];
  slotMap?: Record<string, string | null>;
  frameMap?: Record<string, string>;
  frameDesignMap?: Record<string, string>;
}

const STORAGE_PREFIX = 'PraGana_gallery_v2_';

export function getStorageKey(username: string): string {
  return `${STORAGE_PREFIX}${username}`;
}

/**
 * Loads stored gallery customizations from browser localStorage.
 */
export function getStoredGalleryData(username: string): StoredGalleryData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getStorageKey(username));
    if (!raw) return null;
    return JSON.parse(raw) as StoredGalleryData;
  } catch (err) {
    console.warn('Failed to load gallery data from localStorage:', err);
    return null;
  }
}

/**
 * Saves gallery customizations to localStorage, dispatches cross-tab & local events,
 * and synchronizes with the server API in the background.
 */
export function saveStoredGalleryData(
  username: string,
  data: StoredGalleryData
): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getStoredGalleryData(username) || {};
    const updated: StoredGalleryData = {
      gallery: { ...(current.gallery || {}), ...(data.gallery || {}) },
      artworks: data.artworks !== undefined ? data.artworks : (current.artworks || []),
      slotMap: { ...(current.slotMap || {}), ...(data.slotMap || {}) },
      frameMap: { ...(current.frameMap || {}), ...(data.frameMap || {}) },
      frameDesignMap: { ...(current.frameDesignMap || {}), ...(data.frameDesignMap || {}) },
    };

    const serialized = JSON.stringify(updated);
    localStorage.setItem(getStorageKey(username), serialized);

    // Dispatch custom event for same-window components
    window.dispatchEvent(
      new CustomEvent('PraGana_gallery_updated', {
        detail: { username, data: updated },
      })
    );

    // Sync with server API in background
    fetch(`/api/gallery/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
    }).catch((err) => {
      console.warn('Background server sync warning:', err);
    });
  } catch (err) {
    console.error('Failed to save gallery data:', err);
  }
}

/**
 * Merges a server/mock GalleryWithArtworks with any local stored catalog artworks and slot assignments.
 */
export function mergeGalleryWithStorage(
  baseGallery: GalleryWithArtworks,
  username: string
): GalleryWithArtworks {
  const stored = getStoredGalleryData(username);
  if (!stored) return baseGallery;

  const artworksById = new Map<string, Artwork>();

  // 1. Index base artworks and preset catalog artworks
  baseGallery.slots.forEach((s) => {
    if (s.artwork) {
      artworksById.set(s.artwork.id, s.artwork);
    }
  });

  if (Array.isArray(PRESET_CATALOG_ARTWORKS)) {
    PRESET_CATALOG_ARTWORKS.forEach((a) => {
      artworksById.set(a.id, a);
    });
  }

  // 2. Index custom user uploaded artworks
  if (Array.isArray(stored.artworks)) {
    stored.artworks.forEach((art) => {
      artworksById.set(art.id, art);
    });
  }

  // 3. Resolve assigned slots and frame selections
  const mergedSlots = baseGallery.slots.map((slot) => {
    const assignedArtworkId =
      stored.slotMap && stored.slotMap[slot.slot_identifier] !== undefined
        ? stored.slotMap[slot.slot_identifier]
        : slot.artwork_id;

    const resolvedArtwork = assignedArtworkId
      ? artworksById.get(assignedArtworkId) ?? null
      : null;

    const resolvedFrameGlbId =
      stored.frameMap?.[slot.slot_identifier] ??
      slot.frame_glb_id ??
      'minimal-black';

    const resolvedFrameDesignId =
      stored.frameDesignMap?.[slot.slot_identifier] ??
      slot.frame_design_id ??
      'classic-box';

    return {
      ...slot,
      artwork_id: assignedArtworkId,
      artwork: resolvedArtwork,
      frame_glb_id: resolvedFrameGlbId,
      frame_design_id: resolvedFrameDesignId,
    };
  });

  // Also sync stored frameMap and frameDesignMap into interior_config.frames
  const existingFrames = baseGallery.interior_config?.frames ?? [];
  const updatedFrames = [...existingFrames];
  if (stored.frameMap || stored.frameDesignMap) {
    const allSlotIds = new Set([
      ...Object.keys(stored.frameMap || {}),
      ...Object.keys(stored.frameDesignMap || {}),
    ]);
    allSlotIds.forEach((slotId) => {
      const frameId = stored.frameMap?.[slotId];
      const designId = stored.frameDesignMap?.[slotId];
      const idx = updatedFrames.findIndex((f: any) => f.slot_identifier === slotId);
      if (idx >= 0) {
        updatedFrames[idx] = {
          ...updatedFrames[idx],
          ...(frameId ? { frame_glb_id: frameId } : {}),
          ...(designId ? { frame_design_id: designId } : {}),
        };
      } else {
        updatedFrames.push({
          slot_identifier: slotId,
          frame_glb_id: frameId || 'minimal-black',
          frame_design_id: designId || 'classic-box',
        });
      }
    });
  }

  const mergedGallery = {
    ...baseGallery,
    ...(stored.gallery || {}),
    slots: mergedSlots,
  };

  if (mergedGallery.interior_config) {
    mergedGallery.interior_config = {
      ...mergedGallery.interior_config,
      frames: updatedFrames,
    };
  }

  return mergedGallery;
}

/**
 * React hook/listener to automatically sync gallery changes between tabs and views.
 */
export function subscribeToGalleryUpdates(
  username: string,
  onUpdate: (updated: StoredGalleryData) => void
): () => void {
  if (typeof window === 'undefined') return () => { };

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.username === username && custom.detail?.data) {
      onUpdate(custom.detail.data);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === getStorageKey(username) && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onUpdate(parsed);
      } catch (err) {
        console.warn('Error parsing storage event payload:', err);
      }
    }
  };

  window.addEventListener('PraGana_gallery_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('PraGana_gallery_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
