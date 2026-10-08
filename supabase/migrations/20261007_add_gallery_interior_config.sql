-- ==============================================================================
-- Migration: Add interior_config JSONB Column to Galleries Table
-- Stores wall_material_id, floor_material_id, ceiling_type, and frames array
-- linking artwork IDs to specific frame GLB IDs.
-- ==============================================================================

-- 1. Alter galleries table to add the new interior_config column
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS interior_config JSONB NOT NULL DEFAULT '{
  "wall_material_id": "minimal-white",
  "floor_material_id": "polished-concrete",
  "ceiling_type": "recessed-spotlight",
  "frames": []
}'::jsonb;

-- 2. Add documentation comments describing column schema
COMMENT ON COLUMN galleries.interior_config IS 'Interior spatial configuration storing wall_material_id, floor_material_id, ceiling_type, and frames linking artwork IDs to specific frame GLB IDs';
