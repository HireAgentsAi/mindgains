/*
  # Fix user_stats foreign key relationship

  1. Database Changes
    - Add proper foreign key constraint from user_stats.user_id to profiles.id
    - This enables Supabase to perform joins between user_stats and profiles tables

  2. Security
    - No changes to existing RLS policies
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_stats_user_id_profiles_fkey'
    AND table_name = 'user_stats'
  ) THEN
    ALTER TABLE user_stats 
    ADD CONSTRAINT user_stats_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;