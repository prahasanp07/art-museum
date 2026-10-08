-- Supabase Storage Bucket Migration: gallery-assets
-- Creates public bucket for high-res 3D artworks, textures, and GLB environment files

-- 1. Create the 'gallery-assets' bucket with public access enabled
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery-assets',
  'gallery-assets',
  true,
  52428800, -- 50MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'model/gltf-binary']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Public Read Access Policy: All visitors can stream textures in the 3D gallery
CREATE POLICY "Public gallery assets access"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-assets');

-- 3. Authenticated Insert Policy: Creators can upload into their tenant folder ({user_id}/*)
CREATE POLICY "Authenticated users can upload artwork assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Authenticated Update Policy: Creators can update their own artwork assets
CREATE POLICY "Users can update their own artwork assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Authenticated Delete Policy: Creators can delete their own artwork assets
CREATE POLICY "Users can delete their own artwork assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
