import { Suspense } from 'react';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { Navbar } from '@/components/ui/Navbar';
import { MOCK_GALLERIES, MOCK_PROFILES, PRESET_CATALOG_ARTWORKS } from '@/lib/mockData';
import { Artwork, Gallery, Profile } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creator Dashboard | Imagini 3D Digital Art Museum',
  description: 'Manage your 3D digital museum, spatial template, surface materials, and artwork catalog.',
};

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070c] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-32 pb-24">
        {/* Shimmer Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10 mb-8 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 shrink-0" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-44 bg-slate-800 rounded-lg" />
                <div className="h-5 w-24 bg-slate-800/80 rounded-full" />
                <div className="h-5 w-20 bg-slate-800/80 rounded-full" />
              </div>
              <div className="h-4 w-72 bg-slate-800/60 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 bg-slate-800/80 rounded-xl" />
            <div className="h-10 w-32 bg-slate-800/80 rounded-xl" />
          </div>
        </div>

        {/* Shimmer Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>

        {/* Shimmer Customizer Panel */}
        <div className="bg-[#0b101d]/90 border border-white/10 rounded-2xl p-8 h-96 animate-pulse" />
      </main>
    </div>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams?: Promise<{ demo?: string }>;
}) {
  await connection();
  const resolvedParams = searchParams ? await searchParams : undefined;
  const isExplicitDemo = resolvedParams?.demo === 'true';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultGallery = MOCK_GALLERIES['pragana-innovations'];
  let profile: Profile = MOCK_PROFILES[0];
  let isDemoUser = isExplicitDemo || !user;

  let gallery: Gallery = {
    id: defaultGallery.id,
    profile_id: defaultGallery.profile_id,
    template_id: defaultGallery.template_id,
    is_published: defaultGallery.is_published,
    custom_ambient_light_hex: defaultGallery.custom_ambient_light_hex,
    wall_texture_id: defaultGallery.wall_texture_id || 'minimal-white',
    floor_texture_id: defaultGallery.floor_texture_id || 'polished-concrete',
    interior_config: defaultGallery.interior_config,
    created_at: defaultGallery.created_at,
  };

  let artworks: Artwork[] = PRESET_CATALOG_ARTWORKS;
  const slotMap: Record<string, string | null> = {};
  defaultGallery.slots.forEach((s) => {
    slotMap[s.slot_identifier] = s.artwork_id;
  });

  // If user is logged in, fetch their authentic profile and data server-side
  if (user && !isExplicitDemo) {
    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbProfile) {
      profile = dbProfile;
    } else {
      profile = {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'curator',
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Curator',
        bio: 'Curator at Imagini Digital Museum',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
      };
    }

    // Fetch user's active gallery
    const { data: dbGallery } = await supabase
      .from('galleries')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (dbGallery) {
      gallery = {
        ...gallery,
        ...dbGallery,
      };

      // Fetch user's configured slots
      const { data: dbSlots } = await supabase
        .from('gallery_slots')
        .select('*')
        .eq('gallery_id', dbGallery.id);

      if (dbSlots && dbSlots.length > 0) {
        dbSlots.forEach((s) => {
          slotMap[s.slot_identifier] = s.artwork_id;
        });
      }
    }

    // Fetch user's uploaded artworks
    const { data: dbArtworks } = await supabase
      .from('artworks')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (dbArtworks && dbArtworks.length > 0) {
      const combined = [...dbArtworks, ...PRESET_CATALOG_ARTWORKS];
      artworks = Array.from(new Map(combined.map((a) => [a.id, a])).values());
    }
  }

  return (
    <DashboardClient
      initialProfile={profile}
      initialGallery={gallery}
      initialArtworks={artworks}
      initialSlotMap={slotMap}
      initialIsDemoUser={isDemoUser}
    />
  );
}

export default function DashboardPage(props: {
  searchParams?: Promise<{ demo?: string }>;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent {...props} />
    </Suspense>
  );
}
