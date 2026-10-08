import { NextRequest, NextResponse } from 'next/server';
import { getGalleryByUsername, PRESET_CATALOG_ARTWORKS } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/server';
import { Artwork, Gallery, GallerySlot, GalleryWithArtworks } from '@/lib/types';

// In-memory server cache for persistent customization across SSR & client sessions
const galleryMemoryStore: Record<
  string,
  {
    gallery: Partial<Gallery>;
    artworks: Artwork[];
    slotMap: Record<string, string | null>;
  }
> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const fallback = getGalleryByUsername(username);

  // Check in-memory store first
  const cached = galleryMemoryStore[username];

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (profile) {
      const { data: gallery } = await supabase
        .from('galleries')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (gallery) {
        const { data: slots } = await supabase
          .from('gallery_slots')
          .select('*, artwork:artworks(*)')
          .eq('gallery_id', gallery.id);

        if (slots && slots.length > 0) {
          return NextResponse.json({
            ...gallery,
            profile,
            slots: slots.map((s: any) => ({
              ...s,
              artwork: s.artwork ?? null,
            })),
          });
        }
      }
    }
  } catch (err) {
    // Supabase fallback handled gracefully
  }

  if (cached) {
    const artworksById = new Map<string, Artwork>();
    // Index base and preset artworks
    fallback.slots.forEach((s) => {
      if (s.artwork) artworksById.set(s.artwork.id, s.artwork);
    });
    PRESET_CATALOG_ARTWORKS.forEach((a) => {
      artworksById.set(a.id, a);
    });
    // Overlay custom artworks
    cached.artworks?.forEach((a) => {
      artworksById.set(a.id, a);
    });

    const mergedSlots = fallback.slots.map((s) => {
      const assignedArtworkId =
        cached.slotMap[s.slot_identifier] !== undefined
          ? cached.slotMap[s.slot_identifier]
          : s.artwork_id;

      const artwork = assignedArtworkId
        ? artworksById.get(assignedArtworkId) ?? null
        : null;

      return {
        ...s,
        artwork_id: assignedArtworkId,
        artwork,
      };
    });

    const mergedGallery: GalleryWithArtworks = {
      ...fallback,
      ...(cached.gallery || {}),
      slots: mergedSlots,
    };

    return NextResponse.json(mergedGallery);
  }

  return NextResponse.json(fallback);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const body = await request.json();
    const { gallery, artworks, slotMap } = body;

    if (!galleryMemoryStore[username]) {
      galleryMemoryStore[username] = {
        gallery: {},
        artworks: [],
        slotMap: {},
      };
    }

    if (gallery) {
      galleryMemoryStore[username].gallery = {
        ...galleryMemoryStore[username].gallery,
        ...gallery,
      };
    }

    if (Array.isArray(artworks)) {
      galleryMemoryStore[username].artworks = artworks;
    }

    if (slotMap && typeof slotMap === 'object') {
      galleryMemoryStore[username].slotMap = {
        ...galleryMemoryStore[username].slotMap,
        ...slotMap,
      };
    }

    // Attempt Supabase synchronization if authenticated
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (gallery) {
          await supabase
            .from('galleries')
            .update(gallery)
            .eq('profile_id', user.id);
        }

        if (Array.isArray(artworks)) {
          for (const art of artworks) {
            await supabase.from('artworks').upsert({
              id: art.id,
              profile_id: user.id,
              title: art.title,
              description: art.description,
              storage_url: art.storage_url,
              external_link: art.external_link,
            });
          }
        }
      }
    } catch {
      // Continue even if Supabase is unauthenticated in demo mode
    }

    return NextResponse.json({
      success: true,
      message: 'Gallery state persisted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
