import * as THREE from 'three';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ActiveProp {
  node_name: string;
  prop_glb_id: string;
}

export interface GalleryFrameConfig {
  artwork_id?: string;
  slot_identifier?: string;
  frame_glb_id: string;
  frame_design_id?: string;
}

export interface FrameProfile {
  id: string;
  name: string;
  roughness: number;
  metalness: number;
  color: string;
  border?: number;
  depth?: number;
  description?: string;
}

export interface FrameDesign {
  id: string;
  name: string;
  tag: string;
  description: string;
  borderMultiplier?: number;
  depthMultiplier?: number;
  floatingGap?: number;
  hasMat?: boolean;
  matColor?: string;
  matWidth?: number;
  steps?: number;
}

export interface GalleryInteriorConfig {
  wall_material_id: string;
  floor_material_id: string;
  ceiling_type: string;
  frames: GalleryFrameConfig[];
}

export interface Gallery {
  id: string;
  profile_id: string;
  template_id: string;
  is_published: boolean;
  custom_ambient_light_hex: string;
  wall_texture_id?: string;
  floor_texture_id?: string;
  active_props?: ActiveProp[];
  interior_config?: GalleryInteriorConfig;
  created_at: string;
}


export interface Artwork {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  storage_url: string;
  external_link: string | null;
  frame_glb_id?: string;
  frame_design_id?: string;
  created_at: string;
}

export interface GallerySlot {
  id: string;
  gallery_id: string;
  artwork_id: string | null;
  slot_identifier: string;
  created_at: string;
  artwork?: Artwork | null;
  frame_glb_id?: string;
  frame_design_id?: string;
}

export interface SlotConfiguration {
  identifier: string;
  position: [number, number, number];
  rotation: [number, number, number];
  normal: [number, number, number];
  size: [number, number]; // [width, height]
}

export interface GalleryWithArtworks extends Gallery {
  profile: Profile;
  slots: (GallerySlot & { artwork: Artwork | null })[];
}
