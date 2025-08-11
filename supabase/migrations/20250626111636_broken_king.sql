/*
  # Fix profiles table RLS policy for user registration

  1. Security Changes
    - Drop existing restrictive INSERT policy on profiles table
    - Create new INSERT policy that allows users to create their own profile during registration
    - Ensure the policy uses auth.uid() to match the user's authenticated ID

  2. Policy Details
    - Allow authenticated users to insert their own profile record
    - Use WITH CHECK clause to ensure user can only insert profile with their own user ID
    - Maintains security while enabling proper user registration flow
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that allows users to create their own profile
CREATE POLICY "Allow authenticated users to insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the existing SELECT and UPDATE policies are correct
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);