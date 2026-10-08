'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface SaveGalleryCustomizationInput {
  galleryId: string;
  profileId: string;
  username: string;
  templateId: string;
  customAmbientLightHex: string;
  wallMaterial: string;
  floorMaterial: string;
  isPublished: boolean;
  slotMap: Record<string, string | null>;
}

export type GalleryActionResult = {
  success?: boolean;
  error?: string;
};

/**
 * Server Action to persist full gallery customization and slot configuration:
 * 1. Updates galleries table (template_id, custom_ambient_light_hex, wall_texture_id, floor_texture_id, is_published, interior_config).
 * 2. Upserts all slot mappings into gallery_slots table.
 * 3. Calls revalidatePath for the public gallery route and dashboard.
 */
export async function saveGalleryCustomization(
  input: SaveGalleryCustomizationInput
): Promise<GalleryActionResult> {
  try {
    const supabase = await createClient();

    // 1. Update galleries table
    const { error: galleryError } = await supabase
      .from('galleries')
      .update({
        template_id: input.templateId,
        custom_ambient_light_hex: input.customAmbientLightHex,
        wall_texture_id: input.wallMaterial,
        floor_texture_id: input.floorMaterial,
        is_published: input.isPublished,
        interior_config: {
          wall_material_id: input.wallMaterial,
          floor_material_id: input.floorMaterial,
          ceiling_type: 'recessed-spotlight',
          frames: [],
        },
      })
      .eq('id', input.galleryId);

    if (galleryError) {
      console.warn('Supabase gallery update warning:', galleryError.message);
    }

    // 2. Upsert gallery_slots for each configured slot
    const slotEntries = Object.entries(input.slotMap);
    for (const [slotIdentifier, artworkId] of slotEntries) {
      const { error: slotError } = await supabase
        .from('gallery_slots')
        .upsert(
          {
            gallery_id: input.galleryId,
            slot_identifier: slotIdentifier,
            artwork_id: artworkId,
          },
          { onConflict: 'gallery_id,slot_identifier' }
        );

      if (slotError) {
        console.warn(`Supabase slot ${slotIdentifier} upsert warning:`, slotError.message);
      }
    }

    // 3. Revalidate public gallery and dashboard routes
    if (input.username) {
      revalidatePath(`/${input.username}`);
      revalidatePath(`/api/gallery/${input.username}`);
    }
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err: any) {
    console.error('saveGalleryCustomization error:', err);
    return { error: err?.message || 'Failed to sync gallery customization' };
  }
}

/**
 * Server Action to upsert a single slot assignment into gallery_slots table
 */
export async function upsertGallerySlotAction(
  galleryId: string,
  slotIdentifier: string,
  artworkId: string | null,
  username?: string
): Promise<GalleryActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('gallery_slots')
      .upsert(
        {
          gallery_id: galleryId,
          slot_identifier: slotIdentifier,
          artwork_id: artworkId,
        },
        { onConflict: 'gallery_id,slot_identifier' }
      );

    if (error) {
      console.warn('upsertGallerySlotAction warning:', error.message);
    }

    if (username) {
      revalidatePath(`/${username}`);
    }
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to upsert gallery slot' };
  }
}
