/*
  # Fix achievements table is_active column

  1. Table Updates
    - Ensure `achievements` table has `is_active` column
    - Add default value for existing records
    - Update any queries that might be causing issues

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access controls

  3. Data Integrity
    - Add proper constraints and defaults
    - Ensure backward compatibility
*/

-- Ensure the achievements table has the is_active column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'achievements' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE achievements ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Update any existing records that might have NULL is_active values
UPDATE achievements 
SET is_active = true 
WHERE is_active IS NULL;

-- Ensure the column has a proper default
ALTER TABLE achievements 
ALTER COLUMN is_active SET DEFAULT true;

-- Add a check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'achievements_is_active_check'
  ) THEN
    ALTER TABLE achievements 
    ADD CONSTRAINT achievements_is_active_check 
    CHECK (is_active IN (true, false));
  END IF;
END $$;

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies for achievements
DROP POLICY IF EXISTS "Anyone can view active achievements" ON achievements;
CREATE POLICY "Anyone can view active achievements"
  ON achievements
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow service role to manage all achievements
DROP POLICY IF EXISTS "Service role can manage achievements" ON achievements;
CREATE POLICY "Service role can manage achievements"
  ON achievements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);