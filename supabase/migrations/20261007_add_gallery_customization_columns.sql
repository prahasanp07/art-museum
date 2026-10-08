-- ==============================================================================
-- Migration: Add Customization and Active Props Columns to Galleries Table
-- Adds wall_texture_id, floor_texture_id, and active_props to track spatial customization
-- ==============================================================================

-- 1. Alter galleries table to add the new columns with default values
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS wall_texture_id TEXT NOT NULL DEFAULT 'minimal-white',
ADD COLUMN IF NOT EXISTS floor_texture_id TEXT NOT NULL DEFAULT 'polished-concrete',
ADD COLUMN IF NOT EXISTS active_props JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Add documentation comments describing column purposes
COMMENT ON COLUMN galleries.wall_texture_id IS 'Texture identifier applied to gallery interior walls (e.g. minimal-white, raw-concrete, dark-obsidian)';
COMMENT ON COLUMN galleries.floor_texture_id IS 'Texture identifier applied to gallery floor surfaces (e.g. polished-concrete, dark-hardwood, marble)';
COMMENT ON COLUMN galleries.active_props IS 'JSONB array of activated architectural and furniture props: Array<{ node_name: text, prop_glb_id: text }>';
