export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Prop item stored in the galleries.active_props JSONB array.
 * Tracks which furniture pieces and spatial props the artist has activated.
 */
export interface ActiveProp {
  node_name: string;
  prop_glb_id: string;
}

/**
 * Frame mapping linking an artwork ID to a specific frame GLB model.
 */
export interface GalleryFrameConfig {
  artwork_id: string;
  frame_glb_id: string;
}

/**
 * Spatial interior configuration stored in galleries.interior_config JSONB.
 */
export interface GalleryInteriorConfig {
  wall_material_id: string;
  floor_material_id: string;
  ceiling_type: string;
  frames: GalleryFrameConfig[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      galleries: {
        Row: {
          id: string;
          profile_id: string;
          template_id: string;
          is_published: boolean;
          custom_ambient_light_hex: string;
          wall_texture_id: string;
          floor_texture_id: string;
          active_props: ActiveProp[];
          interior_config: GalleryInteriorConfig;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          template_id?: string;
          is_published?: boolean;
          custom_ambient_light_hex?: string;
          wall_texture_id?: string;
          floor_texture_id?: string;
          active_props?: ActiveProp[] | Json;
          interior_config?: GalleryInteriorConfig | Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          template_id?: string;
          is_published?: boolean;
          custom_ambient_light_hex?: string;
          wall_texture_id?: string;
          floor_texture_id?: string;
          active_props?: ActiveProp[] | Json;
          interior_config?: GalleryInteriorConfig | Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'galleries_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      artworks: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          description: string | null;
          storage_url: string;
          external_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          description?: string | null;
          storage_url: string;
          external_link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          description?: string | null;
          storage_url?: string;
          external_link?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'artworks_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      gallery_slots: {
        Row: {
          id: string;
          gallery_id: string;
          artwork_id: string | null;
          slot_identifier: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          gallery_id: string;
          artwork_id?: string | null;
          slot_identifier: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          gallery_id?: string;
          artwork_id?: string | null;
          slot_identifier?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gallery_slots_artwork_id_fkey';
            columns: ['artwork_id'];
            isOneToOne: false;
            referencedRelation: 'artworks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gallery_slots_gallery_id_fkey';
            columns: ['gallery_id'];
            isOneToOne: false;
            referencedRelation: 'galleries';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type DbProfile = Tables<'profiles'>;
export type DbGallery = Tables<'galleries'>;
export type DbArtwork = Tables<'artworks'>;
export type DbGallerySlot = Tables<'gallery_slots'>;
