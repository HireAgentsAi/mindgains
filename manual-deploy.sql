-- Manual deployment of Smart Bot System
-- Run this in Supabase Dashboard SQL Editor

-- First check if bot tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_profiles') THEN
    RAISE NOTICE 'Bot tables do not exist. Deploying smart bot system...';
  ELSE
    RAISE NOTICE 'Bot tables already exist. Skipping bot deployment.';
    RETURN;
  END IF;
END
$$;

-- Create tables for random name generation
CREATE TABLE IF NOT EXISTS bot_first_names (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'unisex')) NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_last_names (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL -- north, south, west, east, central
);

-- Bot profiles table
CREATE TABLE IF NOT EXISTS bot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name TEXT NOT NULL,
  avatar_url TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL,
  personality_type TEXT CHECK (personality_type IN ('aggressive', 'cautious', 'balanced', 'random')) NOT NULL,
  min_accuracy DECIMAL(5,2) DEFAULT 40.00,
  max_accuracy DECIMAL(5,2) DEFAULT 95.00,
  avg_response_time INTEGER DEFAULT 5000,
  response_time_variance INTEGER DEFAULT 2000,
  mistake_pattern TEXT CHECK (mistake_pattern IN ('random', 'difficult_questions', 'time_pressure', 'streak_based')) DEFAULT 'random',
  confidence_level DECIMAL(5,2) DEFAULT 0.75,
  quit_probability DECIMAL(5,2) DEFAULT 0.02,
  total_battles INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 50.00,
  total_coins_won INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_bot column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;

-- Check deployment success
SELECT 'Deployment completed! Bot tables created.' as status;