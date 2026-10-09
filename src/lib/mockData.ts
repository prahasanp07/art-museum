import { Artwork, FrameDesign, FrameProfile, GalleryWithArtworks, Profile, SlotConfiguration } from './types';

/**
 * Curatorial framing profiles mapped to physical molding PBR specifications.
 */
export const FRAME_PROFILES: Record<string, FrameProfile> = {
  'minimal-black': {
    id: 'minimal-black',
    name: 'Minimal Obsidian',
    roughness: 0.35,
    metalness: 0.7,
    color: '#15171e',
    border: 0.08,
    depth: 0.06,
    description: 'Matte obsidian profile with subtle specular bevels.',
  },
  'neo-chrome': {
    id: 'neo-chrome',
    name: 'Neo Chrome',
    roughness: 0.1,
    metalness: 0.9,
    color: '#e2e8f0',
    border: 0.07,
    depth: 0.05,
    description: 'Ultra-polished futuristic chrome with hyper-crisp reflections.',
  },
  'matte-brass': {
    id: 'matte-brass',
    name: 'Matte Brass',
    roughness: 0.4,
    metalness: 0.6,
    color: '#d97706',
    border: 0.08,
    depth: 0.06,
    description: 'Hand-rubbed architectural brass with warm amber patina.',
  },
  'floating-shadow-box': {
    id: 'floating-shadow-box',
    name: 'Floating Shadow Box',
    roughness: 0.8,
    metalness: 0.1,
    color: '#1e293b',
    border: 0.09,
    depth: 0.1,
    description: 'Deep matte slate shadow box that suspends the canvas in air.',
  },
  'gilded-wood': {
    id: 'gilded-wood',
    name: 'Gilded Gold',
    roughness: 0.3,
    metalness: 0.65,
    color: '#d4af37',
    border: 0.1,
    depth: 0.08,
    description: 'Classical European gold leaf with warm metallic reflectance.',
  },
  'brushed-aluminum': {
    id: 'brushed-aluminum',
    name: 'Brushed Aluminum',
    roughness: 0.25,
    metalness: 0.9,
    color: '#cbd5e1',
    border: 0.07,
    depth: 0.05,
    description: 'Contemporary architectural anodized silver frame.',
  },
  'classic-walnut': {
    id: 'classic-walnut',
    name: 'Classic Walnut',
    roughness: 0.65,
    metalness: 0.08,
    color: '#3e2723',
    border: 0.09,
    depth: 0.07,
    description: 'Deep organic hardwood grain with dark umber finish.',
  },
  'white-lacquer': {
    id: 'white-lacquer',
    name: 'White Contemporary',
    roughness: 0.2,
    metalness: 0.1,
    color: '#f8fafc',
    border: 0.07,
    depth: 0.05,
    description: 'High-gloss pure white gallery standard molding.',
  },
};

export const FRAME_PROFILE_LIST: FrameProfile[] = Object.values(FRAME_PROFILES);

/**
 * Physical architectural frame designs & mounting geometries.
 */
export const FRAME_DESIGNS: Record<string, FrameDesign> = {
  'classic-box': {
    id: 'classic-box',
    name: 'Classic Box',
    tag: 'Flush Museum Bezel',
    description: 'Precision right-angled gallery moulding with crisp outer edges and standard depth.',
    borderMultiplier: 1.0,
    depthMultiplier: 1.0,
    floatingGap: 0,
    hasMat: false,
    steps: 1,
  },
  'deep-shadowbox': {
    id: 'deep-shadowbox',
    name: 'Deep Shadow Box',
    tag: 'Floating Reveal',
    description: 'Extruded perimeter casing with a recessed shadow gap, suspending the artwork in air.',
    borderMultiplier: 1.15,
    depthMultiplier: 1.85,
    floatingGap: 0.045,
    hasMat: false,
    steps: 1,
  },
  'passe-partout': {
    id: 'passe-partout',
    name: 'Museum Passe-Partout',
    tag: 'Conservation Matboard',
    description: 'Archival off-white bevelled matboard border surrounding the artwork inside a sleek outer frame.',
    borderMultiplier: 0.85,
    depthMultiplier: 1.1,
    floatingGap: 0,
    hasMat: true,
    matColor: '#f1f0ea',
    matWidth: 0.12,
    steps: 1,
  },
  'tiered-baroque': {
    id: 'tiered-baroque',
    name: 'Tiered Moulding',
    tag: 'Double Bevel Relief',
    description: 'Sculptural multi-step architectural profile featuring an outer rail and raised inner bevel fillet.',
    borderMultiplier: 1.3,
    depthMultiplier: 1.35,
    floatingGap: 0,
    hasMat: false,
    steps: 2,
  },
  'canvas-float': {
    id: 'canvas-float',
    name: 'Slim Float Rail',
    tag: 'Minimalist Standoff',
    description: 'Ultra-slim contemporary perimeter reveal showcasing raw-edge canvas presentations.',
    borderMultiplier: 0.45,
    depthMultiplier: 0.8,
    floatingGap: 0.02,
    hasMat: false,
    steps: 1,
  },
};

export const FRAME_DESIGN_LIST: FrameDesign[] = Object.values(FRAME_DESIGNS);

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
        { artwork_id: 'art-warship-01', slot_identifier: 'slot-01', frame_glb_id: 'minimal-black' },
        { artwork_id: 'art-02', slot_identifier: 'slot-02', frame_glb_id: 'neo-chrome' },
        { artwork_id: 'art-03', slot_identifier: 'slot-03', frame_glb_id: 'matte-brass' },
        { artwork_id: 'art-04', slot_identifier: 'slot-04', frame_glb_id: 'floating-shadow-box' },
        { artwork_id: 'art-05', slot_identifier: 'slot-05', frame_glb_id: 'neo-chrome' },
        { artwork_id: 'art-06', slot_identifier: 'slot-06', frame_glb_id: 'matte-brass' },
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
        frame_glb_id: 'minimal-black',
        created_at: '2026-01-16T11:00:00Z',
        artwork: WARSHIP_ARTWORK,
      },
      {
        id: 'gs-02',
        gallery_id: 'g-01',
        artwork_id: 'art-02',
        slot_identifier: 'slot-02',
        frame_glb_id: 'neo-chrome',
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
        frame_glb_id: 'matte-brass',
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
        frame_glb_id: 'floating-shadow-box',
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
        frame_glb_id: 'neo-chrome',
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
        frame_glb_id: 'matte-brass',
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
