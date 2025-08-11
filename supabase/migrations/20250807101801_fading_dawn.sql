/*
  # Fix RLS Permission Errors

  1. Policy Updates
    - Update indian_subjects admin policy to use uid() instead of users table
    - Update subject_topics admin policy to use uid() instead of users table  
    - Update topic_questions admin policy to use uid() instead of users table
    - Update user_topic_progress admin policy to use uid() instead of users table

  2. Security
    - Maintain proper access control using auth.uid()
    - Remove dependency on users table permissions
    - Keep data security intact
*/

-- Drop existing admin policies that reference users table
DROP POLICY IF EXISTS "Admin can manage subjects" ON indian_subjects;
DROP POLICY IF EXISTS "Admin can manage topics" ON subject_topics;
DROP POLICY IF EXISTS "Admin can manage questions" ON topic_questions;
DROP POLICY IF EXISTS "Admin can view all progress" ON user_topic_progress;

-- Create new admin policies using uid() directly
CREATE POLICY "Admin can manage subjects"
  ON indian_subjects
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = '393b7276-f541-47a6-80aa-36c672a4c455')
  WITH CHECK (auth.uid()::text = '393b7276-f541-47a6-80aa-36c672a4c455');

CREATE POLICY "Admin can manage topics"
  ON subject_topics
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = '393b7276-f541-47a6-80aa-36c672a4c455')
  WITH CHECK (auth.uid()::text = '393b7276-f541-47a6-80aa-36c672a4c455');

CREATE POLICY "Admin can manage questions"
  ON topic_questions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = '393b7276-f541-47a6-80aa-36c672a4c455')
  WITH CHECK (auth.uid()::text = '393b7276-f541-47a6-80aa-36c672a4c455');

CREATE POLICY "Admin can view all progress"
  ON user_topic_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = '393b7276-f541-47a6-80aa-36c672a4c455');