import { Artwork, GalleryWithArtworks, Profile, SlotConfiguration } from './types';

/**
 * Architectural slot positions along the gallery corridor.
 * Corresponds to DEFAULT_LOOKAT_WAYPOINTS in CameraController.
 */
export const GALLERY_SLOT_CONFIGS: SlotConfiguration[] = [
  {
    identifier: 'slot-01',
    position: [4.9, 1.7, 0],
    rotation: [0, -Math.PI / 2, 0],
    normal: [-1, 0, 0],
    size: [2.4, 1.8],
  },
  {
    identifier: 'slot-02',
    position: [4.9, 1.7, -6],
    rotation: [0, -Math.PI / 2, 0],
    normal: [-1, 0, 0],
    size: [2.0, 2.5],
  },
  {
    identifier: 'slot-03',
    position: [0, 2.0, -14.8],
    rotation: [0, 0, 0],
    normal: [0, 0, 1],
    size: [3.2, 2.0],
  },
  {
    identifier: 'slot-04',
    position: [-4.9, 1.7, -14],
    rotation: [0, Math.PI / 2, 0],
    normal: [1, 0, 0],
    size: [2.2, 1.8],
  },
  {
    identifier: 'slot-05',
    position: [-4.9, 1.7, -20],
    rotation: [0, Math.PI / 2, 0],
    normal: [1, 0, 0],
    size: [2.5, 2.5],
  },
  {
    identifier: 'slot-06',
    position: [0, 2.2, -27.8],
    rotation: [0, 0, 0],
    normal: [0, 0, 1],
    size: [4.0, 2.4],
  },
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'p-01',
    username: 'pragana-innovations',
    display_name: 'PraGana Innovations',
    bio: 'Generative light & heavy artist & procedural website designer based in India.',
    avatar_url: 'https://instagram.fblr4-5.fna.fbcdn.net/v/t51.2885-19/464718051_1468425147180978_3327036998528007622_n.jpg?_nc_cat=111&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy41MDAuQzMifQ%3D%3D&_nc_ohc=x12sp59T54UQ7kNvwHWw6h5&_nc_oc=AdqtsmcOVTs2W6GiAm_eIhua5uXoT1n_oi1BZ10m6fkyBbRe3Onur2vr9UO6mnKvqfw&_nc_zt=24&_nc_ht=instagram.fblr4-5.fna&_nc_ss=7b6a8&oh=00_AQOOIaodQgsB0JQrREjp0bL8irDg23p79JDp-ifv4S7LVQ&oe=6ACCBD36',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'p-02',
    username: 'kenji-sato',
    display_name: 'Kenji Sato',
    bio: 'Tokyo-based kinetic sculptor translating quantum field theory into spatial installations.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    created_at: '2026-02-10T14:30:00Z',
  },
  {
    id: 'p-03',
    username: 'aara-design',
    display_name: 'Aara Studio',
    bio: 'Digital atelier exploring bio-morphic fractals and post-anthropocentric textures.',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    created_at: '2026-03-01T09:15:00Z',
  },
];

export const WARSHIP_ARTWORK: Artwork = {
  id: 'art-warship-01',
  profile_id: 'p-01',
  title: 'Some old Warship',
  description:
    'Historical maritime study: a fully-rigged classic naval galleon cutting through overcast skies and turbulent waters.',
  storage_url: '/artworks/some-old-warship.jpg',
  external_link: 'https://superrare.com',
  created_at: '2026-01-16T11:00:00Z',
};

export const MOCK_GALLERIES: Record<string, GalleryWithArtworks> = {
  'pragana-innovations': {
    id: 'g-01',
    profile_id: 'p-01',
    template_id: 'minimalist-cube-v1',
    is_published: true,
    custom_ambient_light_hex: '#e2e8f0',
    wall_texture_id: 'raw-concrete',
    floor_texture_id: 'polished-concrete',
    active_props: [],
    interior_config: {
      wall_material_id: 'raw-concrete',
      floor_material_id: 'polished-concrete',
      ceiling_type: 'recessed-spotlight',
      frames: [
        { artwork_id: 'art-01', frame_glb_id: 'minimal-black' },
        { artwork_id: 'art-02', frame_glb_id: 'gilded-wood' },
        { artwork_id: 'art-03', frame_glb_id: 'brushed-aluminum' },
        { artwork_id: 'art-04', frame_glb_id: 'classic-walnut' },
        { artwork_id: 'art-05', frame_glb_id: 'minimal-black' },
        { artwork_id: 'art-06', frame_glb_id: 'brushed-aluminum' },
      ],
    },
    created_at: '2026-01-16T11:00:00Z',
    profile: MOCK_PROFILES[0],
    slots: [
      {
        id: 'gs-01',
        gallery_id: 'g-01',
        artwork_id: 'art-warship-01',
        slot_identifier: 'slot-01',
        created_at: '2026-01-16T11:00:00Z',
        artwork: WARSHIP_ARTWORK,
      },
      {
        id: 'gs-02',
        gallery_id: 'g-01',
        artwork_id: 'art-02',
        slot_identifier: 'slot-02',
        created_at: '2026-01-16T11:00:00Z',
        artwork: {
          id: 'art-02',
          profile_id: 'p-01',
          title: 'Echoes of the Monolith',
          description: 'Procedurally sculpted volcanic basalt intersecting celestial iridescent filaments.',
          storage_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=85',
          external_link: 'https://foundation.app',
          created_at: '2026-01-16T11:00:00Z',
        },
      },
      {
        id: 'gs-03',
        gallery_id: 'g-01',
        artwork_id: 'art-03',
        slot_identifier: 'slot-03',
        created_at: '2026-01-16T11:00:00Z',
        artwork: {
          id: 'art-03',
          profile_id: 'p-01',
          title: 'Hyper-Spatial Tapestry',
          description: 'Autonomous neural cellular automata generating woven fiber structures in continuous equilibrium.',
          storage_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=85',
          external_link: 'https://opensea.io',
          created_at: '2026-01-16T11:00:00Z',
        },
      },
      {
        id: 'gs-04',
        gallery_id: 'g-01',
        artwork_id: 'art-04',
        slot_identifier: 'slot-04',
        created_at: '2026-01-16T11:00:00Z',
        artwork: {
          id: 'art-04',
          profile_id: 'p-01',
          title: 'Nocturne in Zero-G',
          description: 'Gravitational wave harmonics visualized as dark matter fluid dynamics.',
          storage_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85',
          external_link: 'https://superrare.com',
          created_at: '2026-01-16T11:00:00Z',
        },
      },
      {
        id: 'gs-05',
        gallery_id: 'g-01',
        artwork_id: 'art-05',
        slot_identifier: 'slot-05',
        created_at: '2026-01-16T11:00:00Z',
        artwork: {
          id: 'art-05',
          profile_id: 'p-01',
          title: 'Synthetic Aurora',
          description: 'Simulated magnetosphere ionization under high-energy solar storms.',
          storage_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=85',
          external_link: 'https://foundation.app',
          created_at: '2026-01-16T11:00:00Z',
        },
      },
      {
        id: 'gs-06',
        gallery_id: 'g-01',
        artwork_id: 'art-warship-01',
        slot_identifier: 'slot-06',
        created_at: '2026-01-16T11:00:00Z',
        artwork: WARSHIP_ARTWORK,
      },
    ],
  },
};

const rawCatalogArtworks: Artwork[] = [
  WARSHIP_ARTWORK,
  ...MOCK_GALLERIES['pragana-innovations'].slots
    .map((s) => s.artwork)
    .filter((a): a is Artwork => a !== null && a !== undefined),
];

export const PRESET_CATALOG_ARTWORKS: Artwork[] = Array.from(
  new Map(rawCatalogArtworks.map((item) => [item.id, item])).values()
);

export function getGalleryByUsername(username: string): GalleryWithArtworks {
  if (MOCK_GALLERIES[username]) {
    return MOCK_GALLERIES[username];
  }

  // Fallback to first creator with username override
  const base = MOCK_GALLERIES['pragana-innovations'];
  return {
    ...base,
    profile: {
      ...base.profile,
      username,
      display_name: `${username.charAt(0).toUpperCase() + username.slice(1)} Gallery`,
    },
  };
}
