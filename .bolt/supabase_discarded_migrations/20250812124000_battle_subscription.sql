-- Add subscription and usage tracking for battle system

-- Create subscription plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB DEFAULT '{}',
  daily_quiz_limit INTEGER DEFAULT 3,
  ai_generation_limit INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, daily_quiz_limit, ai_generation_limit) VALUES
('Free', 'Basic access to MindGains features', 0.00, 0.00, '{"battle_features": {"daily_battles": 5, "ai_generations": 3, "custom_topics": false, "premium_rooms": false}}', 3, 3),
('Premium Monthly', 'Full access to all features', 99.00, NULL, '{"battle_features": {"daily_battles": 999999, "ai_generations": 999999, "custom_topics": true, "premium_rooms": true}}', 999999, 999999),
('Premium Yearly', 'Full access with yearly discount', NULL, 999.00, '{"battle_features": {"daily_battles": 999999, "ai_generations": 999999, "custom_topics": true, "premium_rooms": true}}', 999999, 999999),
('Premium Lifetime', 'Lifetime access for test users', NULL, NULL, '{"battle_features": {"daily_battles": 999999, "ai_generations": 999999, "custom_topics": true, "premium_rooms": true}}', 999999, 999999)
ON CONFLICT (name) DO UPDATE SET
  features = EXCLUDED.features,
  daily_quiz_limit = EXCLUDED.daily_quiz_limit,
  ai_generation_limit = EXCLUDED.ai_generation_limit;

-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL DEFAULT 'Free',
  status TEXT CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  plan_id UUID REFERENCES subscription_plans(id),
  daily_quiz_limit INTEGER DEFAULT 3,
  ai_generation_limit INTEGER DEFAULT 3,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add battle-specific columns to usage tracking
ALTER TABLE usage_tracking 
ADD COLUMN IF NOT EXISTS battles_created INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS battles_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_battle_coins INTEGER DEFAULT 0;

-- Create battle achievements table
CREATE TABLE IF NOT EXISTS battle_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'first_battle', 'battle_winner', 'streak_3', 'streak_5', 'streak_10',
    'big_spender', 'coin_master', 'topic_expert', 'speed_demon',
    'battle_royale', 'unstoppable', 'legend'
  )),
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_type)
);

-- Create battle stats table for detailed tracking
CREATE TABLE IF NOT EXISTS battle_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_battles INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  battles_lost INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0.00,
  total_coins_won INTEGER DEFAULT 0,
  total_coins_lost INTEGER DEFAULT 0,
  highest_win_streak INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  favorite_topic TEXT,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  fastest_battle_time INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create popular topics table for trending topics
CREATE TABLE IF NOT EXISTS popular_battle_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name TEXT NOT NULL,
  category TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  average_difficulty TEXT DEFAULT 'medium',
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_battle_achievements_user ON battle_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_achievements_type ON battle_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_popular_topics_category ON popular_battle_topics(category);
CREATE INDEX IF NOT EXISTS idx_popular_topics_usage ON popular_battle_topics(usage_count DESC);

-- RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_battle_topics ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies (public read)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (true);

-- User subscriptions policies
CREATE POLICY "Users can view their subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their subscription" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their subscription" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);


-- Battle achievements policies
CREATE POLICY "Users can view their achievements" ON battle_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON battle_achievements FOR INSERT WITH CHECK (true);

-- Battle stats policies
CREATE POLICY "Users can view their stats" ON battle_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their stats" ON battle_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert stats" ON battle_stats FOR INSERT WITH CHECK (true);

-- Popular topics policies
CREATE POLICY "Anyone can view popular topics" ON popular_battle_topics FOR SELECT USING (true);
CREATE POLICY "System can manage popular topics" ON popular_battle_topics FOR ALL USING (true);

-- Function to update battle stats
CREATE OR REPLACE FUNCTION update_battle_stats(
  p_user_id UUID,
  p_won BOOLEAN,
  p_coins_change INTEGER,
  p_score INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_battle_duration INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO battle_stats (
    user_id, total_battles, battles_won, battles_lost,
    total_coins_won, total_coins_lost, total_questions_answered,
    total_correct_answers, fastest_battle_time
  ) VALUES (
    p_user_id, 1, 
    CASE WHEN p_won THEN 1 ELSE 0 END,
    CASE WHEN p_won THEN 0 ELSE 1 END,
    CASE WHEN p_coins_change > 0 THEN p_coins_change ELSE 0 END,
    CASE WHEN p_coins_change < 0 THEN ABS(p_coins_change) ELSE 0 END,
    p_total_questions, p_correct_answers, p_battle_duration
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_battles = battle_stats.total_battles + 1,
    battles_won = battle_stats.battles_won + CASE WHEN p_won THEN 1 ELSE 0 END,
    battles_lost = battle_stats.battles_lost + CASE WHEN p_won THEN 0 ELSE 1 END,
    win_percentage = ROUND(
      (battle_stats.battles_won + CASE WHEN p_won THEN 1 ELSE 0 END) * 100.0 / 
      (battle_stats.total_battles + 1), 2
    ),
    total_coins_won = battle_stats.total_coins_won + CASE WHEN p_coins_change > 0 THEN p_coins_change ELSE 0 END,
    total_coins_lost = battle_stats.total_coins_lost + CASE WHEN p_coins_change < 0 THEN ABS(p_coins_change) ELSE 0 END,
    current_win_streak = CASE 
      WHEN p_won THEN battle_stats.current_win_streak + 1 
      ELSE 0 
    END,
    highest_win_streak = GREATEST(
      battle_stats.highest_win_streak,
      CASE WHEN p_won THEN battle_stats.current_win_streak + 1 ELSE battle_stats.current_win_streak END
    ),
    total_questions_answered = battle_stats.total_questions_answered + p_total_questions,
    total_correct_answers = battle_stats.total_correct_answers + p_correct_answers,
    average_score = ROUND(
      (battle_stats.total_correct_answers + p_correct_answers) * 100.0 /
      (battle_stats.total_questions_answered + p_total_questions), 2
    ),
    fastest_battle_time = CASE 
      WHEN battle_stats.fastest_battle_time IS NULL OR p_battle_duration < battle_stats.fastest_battle_time 
      THEN p_battle_duration 
      ELSE battle_stats.fastest_battle_time 
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  user_stats RECORD;
BEGIN
  SELECT * INTO user_stats FROM battle_stats WHERE user_id = p_user_id;
  
  IF user_stats IS NULL THEN
    RETURN;
  END IF;

  -- First battle achievement
  IF user_stats.total_battles = 1 THEN
    INSERT INTO battle_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'first_battle', '{"title": "Battle Rookie", "description": "Completed your first battle!"}')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- Win streak achievements
  IF user_stats.current_win_streak = 3 THEN
    INSERT INTO battle_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'streak_3', '{"title": "On Fire!", "description": "Won 3 battles in a row!"}')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF user_stats.current_win_streak = 5 THEN
    INSERT INTO battle_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'streak_5', '{"title": "Unstoppable!", "description": "Won 5 battles in a row!"}')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF user_stats.current_win_streak = 10 THEN
    INSERT INTO battle_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'streak_10', '{"title": "Legend!", "description": "Won 10 battles in a row!"}')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- Coin achievements
  IF user_stats.total_coins_won >= 10000 THEN
    INSERT INTO battle_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'coin_master', '{"title": "Coin Master", "description": "Won 10,000+ coins in battles!"}')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- High win rate achievement
  IF user_stats.total_battles >= 10 AND user_stats.win_percentage >= 80 THEN
    INSERT INTO battle_achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'battle_royale', '{"title": "Battle Royale", "description": "Maintained 80%+ win rate over 10+ battles!"}')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats after battle completion
CREATE OR REPLACE FUNCTION trigger_update_battle_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called when battle_participants table is updated with final results
  IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
    -- Battle just finished for this participant
    PERFORM update_battle_stats(
      NEW.user_id,
      NEW.coins_won > 0, -- won if they got coins
      NEW.coins_won - NEW.coins_bet, -- net coin change
      NEW.current_score,
      10, -- assuming 10 questions per battle
      NEW.current_score / 10, -- rough estimate of correct answers
      EXTRACT(EPOCH FROM (NEW.finished_at - (SELECT started_at FROM battle_rooms WHERE id = NEW.battle_room_id)))::INTEGER
    );
    
    -- Check for achievements
    PERFORM check_and_award_achievements(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_battle_stats_update ON battle_participants;
CREATE TRIGGER trigger_battle_stats_update
  AFTER UPDATE ON battle_participants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_battle_stats();

-- Set up test user as pro (only if the user exists)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Try to find user by email in profiles table
  SELECT id INTO test_user_id FROM profiles WHERE email = 'ragularvind84@gmail.com' LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Insert or update subscription for test user
    INSERT INTO user_subscriptions (
      user_id,
      subscription_type,
      status,
      started_at,
      expires_at,
      plan_id,
      daily_quiz_limit,
      ai_generation_limit,
      auto_renew
    )
    VALUES (
      test_user_id,
      'Premium Lifetime',
      'active',
      NOW(),
      NOW() + INTERVAL '10 years',
      (SELECT id FROM subscription_plans WHERE name = 'Premium Lifetime' LIMIT 1),
      999999,
      999999,
      false
    )
    ON CONFLICT (user_id) DO UPDATE SET
      subscription_type = 'Premium Lifetime',
      status = 'active',
      expires_at = NOW() + INTERVAL '10 years',
      daily_quiz_limit = 999999,
      ai_generation_limit = 999999;

    -- Give test user some starting coins
    INSERT INTO user_coins (user_id, balance, total_earned)
    VALUES (test_user_id, 50000, 50000)
    ON CONFLICT (user_id) DO UPDATE SET
      balance = GREATEST(user_coins.balance, 50000),
      total_earned = GREATEST(user_coins.total_earned, 50000);
  END IF;
END $$;

-- Insert popular topics
INSERT INTO popular_battle_topics (topic_name, category, usage_count, success_rate) VALUES
('Indian History and Freedom Struggle', 'History', 1500, 78.5),
('Indian Constitution and Polity', 'Polity', 1350, 82.1),
('Geography of India', 'Geography', 1200, 75.3),
('Current Affairs 2024', 'Current Affairs', 1800, 68.9),
('Economics and Banking', 'Economics', 950, 79.4),
('Science and Technology', 'Science', 1100, 81.2),
('Quantitative Aptitude', 'Mathematics', 1050, 73.8),
('English Language and Comprehension', 'English', 900, 77.6)
ON CONFLICT DO NOTHING;