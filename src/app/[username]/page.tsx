import { Suspense } from 'react';
import { getGalleryByUsername } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/server';
import { ClientGalleryView } from '@/components/3d/ClientGalleryView';
import { GalleryWithArtworks } from '@/lib/types';
import type { Metadata } from 'next';
import { connection } from 'next/server';

interface GalleryPageProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ template?: string }>;
}

/**
 * Hydrates user profile, active gallery configuration (including custom_ambient_light_hex
 * and template_id), and associated gallery slots with joined artworks from Supabase.
 */
async function fetchGalleryData(username: string): Promise<GalleryWithArtworks> {
  let timerId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<null>((resolve) => {
    timerId = setTimeout(() => resolve(null), 2500);
  });

  const fetchPromise = (async (): Promise<GalleryWithArtworks | null> => {
    try {
      const supabase = await createClient();

      // 1. Fetch user's profile record from Supabase
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, created_at')
        .eq('username', username)
        .maybeSingle();

      if (!profileErr && profile) {
        // 2. Fetch the active gallery configuration for this profile
        const { data: gallery, error: galleryErr } = await supabase
          .from('galleries')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!galleryErr && gallery) {
          // 3. Fetch all associated gallery_slots with joined artworks
          const { data: slots, error: slotsErr } = await supabase
            .from('gallery_slots')
            .select(`
              id,
              gallery_id,
              slot_identifier,
              artwork_id,
              created_at,
              artwork:artworks (
                id,
                profile_id,
                title,
                description,
                storage_url,
                external_link,
                created_at
              )
            `)
            .eq('gallery_id', gallery.id);

          const fallback = getGalleryByUsername(username);

          // Normalize slots to ensure joined artwork relation is typed and unwrapped
          const hydratedSlots =
            !slotsErr && slots && slots.length > 0
              ? slots.map((s: any) => {
                  const rawArt = s.artwork;
                  const artwork = Array.isArray(rawArt) ? (rawArt[0] ?? null) : (rawArt ?? null);
                  return {
                    id: s.id,
                    gallery_id: s.gallery_id,
                    slot_identifier: s.slot_identifier,
                    artwork_id: s.artwork_id,
                    created_at: s.created_at,
                    artwork,
                  };
                })
              : fallback.slots;

          return {
            id: gallery.id,
            profile_id: gallery.profile_id,
            template_id: gallery.template_id || 'minimalist-cube-v1',
            custom_ambient_light_hex: gallery.custom_ambient_light_hex || '#ffffff',
            is_published: gallery.is_published ?? true,
            wall_texture_id: gallery.wall_texture_id,
            floor_texture_id: gallery.floor_texture_id,
            active_props: gallery.active_props,
            interior_config: gallery.interior_config,
            created_at: gallery.created_at,
            profile,
            slots: hydratedSlots,
          };
        } else {
          // User profile exists in database; hydrate with live profile metadata
          const fallback = getGalleryByUsername(username);
          return {
            ...fallback,
            profile,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase gallery hydration fallback:', err);
    }
    return null;
  })();

  const result = await Promise.race([fetchPromise, timeoutPromise]);
  if (timerId) clearTimeout(timerId);
  if (result) return result;

  return getGalleryByUsername(username);
}

export async function generateMetadata({
  params,
}: GalleryPageProps): Promise<Metadata> {
  await connection();
  const { username } = await params;
  const gallery = await fetchGalleryData(username);

  return {
    title: `${gallery.profile.display_name || username}'s 3D Gallery | PraGana`,
    description:
      gallery.profile.bio ||
      `Explore ${username}'s spatial 3D art exhibition hall in 60fps WebGL.`,
  };
}

async function GalleryContent({ params, searchParams }: GalleryPageProps) {
  await connection();
  const { username } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const gallery = await fetchGalleryData(username);

  const finalGallery = resolvedSearchParams?.template
    ? { ...gallery, template_id: resolvedSearchParams.template }
    : gallery;

  return <ClientGalleryView initialGallery={finalGallery} username={username} />;
}

export default function GalleryPage(props: GalleryPageProps) {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#05070c] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-cyan-300">
              Initializing 60fps WebGL Viewport...
            </span>
          </div>
        </div>
      }
    >
      <GalleryContent {...props} />
    </Suspense>
  );
}
