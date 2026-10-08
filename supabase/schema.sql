-- ==============================================================================
-- Imagini - 3D DIGITAL ART MUSEUM - COMPLETE SUPABASE SCHEMA & STORAGE
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Database Tables
-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Galleries Table
CREATE TABLE IF NOT EXISTS galleries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'minimalist-cube-v1',
  is_published BOOLEAN DEFAULT FALSE,
  custom_ambient_light_hex TEXT DEFAULT '#ffffff',
  wall_texture_id TEXT NOT NULL DEFAULT 'minimal-white',
  floor_texture_id TEXT NOT NULL DEFAULT 'polished-concrete',
  active_props JSONB NOT NULL DEFAULT '[]'::jsonb,
  interior_config JSONB NOT NULL DEFAULT '{"wall_material_id":"minimal-white","floor_material_id":"polished-concrete","ceiling_type":"recessed-spotlight","frames":[]}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure columns exist if table was previously created
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS wall_texture_id TEXT NOT NULL DEFAULT 'minimal-white',
ADD COLUMN IF NOT EXISTS floor_texture_id TEXT NOT NULL DEFAULT 'polished-concrete',
ADD COLUMN IF NOT EXISTS active_props JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interior_config JSONB NOT NULL DEFAULT '{"wall_material_id":"minimal-white","floor_material_id":"polished-concrete","ceiling_type":"recessed-spotlight","frames":[]}'::jsonb;


-- Artworks Table
CREATE TABLE IF NOT EXISTS artworks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  storage_url TEXT NOT NULL,
  external_link TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Gallery Slots Table
CREATE TABLE IF NOT EXISTS gallery_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  slot_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(gallery_id, slot_identifier)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_slots ENABLE ROW LEVEL SECURITY;

-- 4. Table RLS Policies
-- Public Read Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Published galleries are viewable by everyone" ON galleries;
CREATE POLICY "Published galleries are viewable by everyone" ON galleries FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Artworks of published galleries are viewable" ON artworks;
CREATE POLICY "Artworks of published galleries are viewable" ON artworks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Slots of published galleries are viewable" ON gallery_slots;
CREATE POLICY "Slots of published galleries are viewable" ON gallery_slots FOR SELECT USING (true);

-- Authenticated Owner Write Policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can modify their own galleries" ON galleries;
CREATE POLICY "Users can modify their own galleries" ON galleries FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can modify their own artworks" ON artworks;
CREATE POLICY "Users can modify their own artworks" ON artworks FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can modify their gallery slots" ON gallery_slots;
CREATE POLICY "Users can modify their gallery slots" ON gallery_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_slots.gallery_id AND galleries.profile_id = auth.uid())
);

-- 5. Storage Bucket Configuration ('gallery-assets')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery-assets',
  'gallery-assets',
  true,
  52428800, -- 50MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'model/gltf-binary']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Row Level Security Policies
DROP POLICY IF EXISTS "Public gallery assets access" ON storage.objects;
CREATE POLICY "Public gallery assets access"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-assets');

DROP POLICY IF EXISTS "Authenticated users can upload artwork assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload artwork assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own artwork assets" ON storage.objects;
CREATE POLICY "Users can update their own artwork assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own artwork assets" ON storage.objects;
CREATE POLICY "Users can delete their own artwork assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
