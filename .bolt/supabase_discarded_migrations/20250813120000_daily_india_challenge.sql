-- Daily India Challenge - Nationwide Educational Tournament System
-- This will make MindGains the #1 most addictive educational app in India!

-- Daily challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL, -- 'Current Affairs', 'Indian History', 'GK', 'UPSC', etc.
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')) DEFAULT 'mixed',
  
  -- Tournament settings
  start_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 9 PM IST
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,   -- 9:30 PM IST
  max_participants INTEGER DEFAULT 1000000, -- 1 million Indians!
  entry_fee INTEGER DEFAULT 0, -- ₹0 for free challenges, ₹10-50 for premium
  
  -- Prize pool
  total_prize_pool INTEGER DEFAULT 10000, -- ₹10,000 daily
  winner_prizes JSONB DEFAULT '{"1st": 5000, "2nd": 2000, "3rd": 1000, "top_10": 200}',
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  
  -- Challenge data
  questions JSONB NOT NULL, -- Array of 20 questions
  total_questions INTEGER DEFAULT 20,
  time_per_question INTEGER DEFAULT 30, -- 30 seconds each
  
  -- Status and stats
  status TEXT CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')) DEFAULT 'upcoming',
  total_participants INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- User details
  state TEXT NOT NULL, -- User's state for State vs State battles
  city TEXT,
  
  -- Performance
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_taken INTEGER, -- Total time in seconds
  answers JSONB DEFAULT '[]', -- Array of user answers
  
  -- Rankings
  overall_rank INTEGER,
  state_rank INTEGER,
  city_rank INTEGER,
  
  -- Rewards
  prize_won INTEGER DEFAULT 0,
  coins_won INTEGER DEFAULT 0,
  
  -- Status
  finished_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(challenge_id, user_id)
);

-- State leaderboards for epic State vs State battles
CREATE TABLE IF NOT EXISTS state_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  
  -- State performance
  total_participants INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  total_score INTEGER DEFAULT 0,
  top_scorer_id UUID REFERENCES profiles(id),
  top_score INTEGER DEFAULT 0,
  
  -- State ranking
  state_rank INTEGER,
  
  -- State pride stats
  participation_rate DECIMAL(5,2) DEFAULT 0.00, -- % of state users who joined
  win_streak INTEGER DEFAULT 0, -- Days this state was #1
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(challenge_id, state)
);

-- Live tournament moments (for exciting highlights)
CREATE TABLE IF NOT EXISTS tournament_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  moment_type TEXT CHECK (moment_type IN ('milestone', 'upset', 'streak', 'comeback', 'record')) NOT NULL,
  
  -- Moment details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  participant_id UUID REFERENCES profiles(id),
  state TEXT,
  
  -- Stats when moment happened
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  participants_count INTEGER,
  current_leader TEXT, -- State name
  
  -- Engagement
  is_viral BOOLEAN DEFAULT false, -- Trending moment
  share_count INTEGER DEFAULT 0,
  
  -- Media
  screenshot_url TEXT, -- Auto-generated excitement screenshots
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prize distribution tracking
CREATE TABLE IF NOT EXISTS prize_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Prize details
  prize_type TEXT CHECK (prize_type IN ('cash', 'coins', 'voucher', 'trophy')) NOT NULL,
  amount INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  
  -- Payment
  payment_status TEXT CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  payment_method TEXT, -- 'upi', 'paytm', 'bank_transfer'
  payment_reference TEXT,
  upi_id TEXT,
  
  -- Processing
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily challenge stats for analytics
CREATE TABLE IF NOT EXISTS daily_stats (
  challenge_date DATE PRIMARY KEY,
  
  -- Participation
  total_participants INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  premium_entries INTEGER DEFAULT 0,
  
  -- Revenue
  total_revenue INTEGER DEFAULT 0,
  total_prizes_paid INTEGER DEFAULT 0,
  profit INTEGER DEFAULT 0,
  
  -- Engagement
  average_score DECIMAL(5,2) DEFAULT 0.00,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  sharing_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Top performing states
  winning_state TEXT,
  runner_up_state TEXT,
  most_improved_state TEXT,
  
  -- Virality
  social_shares INTEGER DEFAULT 0,
  media_mentions INTEGER DEFAULT 0,
  trend_score DECIMAL(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_status ON daily_challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_state ON challenge_participants(state);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_score ON challenge_participants(score DESC);
CREATE INDEX IF NOT EXISTS idx_state_leaderboards_challenge ON state_leaderboards(challenge_id);
CREATE INDEX IF NOT EXISTS idx_state_leaderboards_rank ON state_leaderboards(state_rank);
CREATE INDEX IF NOT EXISTS idx_tournament_moments_challenge ON tournament_moments(challenge_id);
CREATE INDEX IF NOT EXISTS idx_tournament_moments_viral ON tournament_moments(is_viral);
CREATE INDEX IF NOT EXISTS idx_prize_distributions_challenge ON prize_distributions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_prize_distributions_status ON prize_distributions(payment_status);

-- RLS policies
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Public can view challenges and leaderboards
CREATE POLICY "Anyone can view daily challenges" ON daily_challenges FOR SELECT USING (true);
CREATE POLICY "Anyone can view state leaderboards" ON state_leaderboards FOR SELECT USING (true);
CREATE POLICY "Anyone can view tournament moments" ON tournament_moments FOR SELECT USING (true);
CREATE POLICY "Anyone can view daily stats" ON daily_stats FOR SELECT USING (true);

-- Users can manage their own participation
CREATE POLICY "Users can view their participation" ON challenge_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their answers" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their prizes
CREATE POLICY "Users can view their prizes" ON prize_distributions FOR SELECT USING (auth.uid() = user_id);

-- System can manage everything
CREATE POLICY "System can manage challenges" ON daily_challenges FOR ALL USING (true);
CREATE POLICY "System can manage participants" ON challenge_participants FOR ALL USING (true);
CREATE POLICY "System can manage leaderboards" ON state_leaderboards FOR ALL USING (true);
CREATE POLICY "System can manage moments" ON tournament_moments FOR ALL USING (true);
CREATE POLICY "System can manage prizes" ON prize_distributions FOR ALL USING (true);
CREATE POLICY "System can manage stats" ON daily_stats FOR ALL USING (true);

-- Function to calculate state rankings after challenge
CREATE OR REPLACE FUNCTION calculate_state_rankings(p_challenge_id UUID)
RETURNS void AS $$
BEGIN
  -- Update state leaderboards with aggregated data
  INSERT INTO state_leaderboards (challenge_id, state, total_participants, average_score, total_score, top_scorer_id, top_score)
  SELECT 
    p_challenge_id,
    cp.state,
    COUNT(*) as total_participants,
    ROUND(AVG(cp.score), 2) as average_score,
    SUM(cp.score) as total_score,
    (SELECT user_id FROM challenge_participants WHERE challenge_id = p_challenge_id AND state = cp.state ORDER BY score DESC LIMIT 1) as top_scorer_id,
    MAX(cp.score) as top_score
  FROM challenge_participants cp
  WHERE cp.challenge_id = p_challenge_id
  GROUP BY cp.state
  ON CONFLICT (challenge_id, state) DO UPDATE SET
    total_participants = EXCLUDED.total_participants,
    average_score = EXCLUDED.average_score,
    total_score = EXCLUDED.total_score,
    top_scorer_id = EXCLUDED.top_scorer_id,
    top_score = EXCLUDED.top_score;
    
  -- Assign state rankings based on average score
  WITH ranked_states AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY average_score DESC, total_score DESC) as rank
    FROM state_leaderboards 
    WHERE challenge_id = p_challenge_id
  )
  UPDATE state_leaderboards 
  SET state_rank = ranked_states.rank
  FROM ranked_states 
  WHERE state_leaderboards.id = ranked_states.id;
  
  -- Update individual rankings
  WITH ranked_participants AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC, time_taken ASC) as overall_rank,
      ROW_NUMBER() OVER (PARTITION BY state ORDER BY score DESC, time_taken ASC) as state_rank
    FROM challenge_participants 
    WHERE challenge_id = p_challenge_id
  )
  UPDATE challenge_participants 
  SET 
    overall_rank = ranked_participants.overall_rank,
    state_rank = ranked_participants.state_rank
  FROM ranked_participants 
  WHERE challenge_participants.id = ranked_participants.id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate exciting tournament moments
CREATE OR REPLACE FUNCTION generate_tournament_moment(
  p_challenge_id UUID,
  p_moment_type TEXT,
  p_participant_id UUID DEFAULT NULL,
  p_custom_title TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_participant RECORD;
  v_title TEXT;
  v_description TEXT;
  v_state TEXT;
BEGIN
  -- Get participant info if provided
  IF p_participant_id IS NOT NULL THEN
    SELECT p.full_name, cp.state INTO v_participant.full_name, v_state
    FROM profiles p
    JOIN challenge_participants cp ON p.id = cp.user_id
    WHERE p.id = p_participant_id AND cp.challenge_id = p_challenge_id;
  END IF;
  
  -- Generate moment based on type
  CASE p_moment_type
    WHEN 'milestone' THEN
      v_title := '🎯 ' || COALESCE(p_custom_title, '10,000 Indians Battle Live!');
      v_description := 'The Daily India Challenge crosses another participation milestone!';
    
    WHEN 'upset' THEN
      v_title := '🔥 UPSET ALERT: ' || v_state || ' Takes the Lead!';
      v_description := v_participant.full_name || ' from ' || v_state || ' just shocked everyone with a perfect score!';
      
    WHEN 'streak' THEN
      v_title := '⚡ ' || v_state || ' Continues Domination!';
      v_description := v_state || ' extends their winning streak - can anyone stop them?';
      
    WHEN 'comeback' THEN
      v_title := '🚀 Epic Comeback by ' || v_state || '!';
      v_description := 'From last place to top 3! ' || v_state || ' proves why they never give up!';
      
    WHEN 'record' THEN
      v_title := '🏆 NEW RECORD: ' || v_participant.full_name || ' Makes History!';
      v_description := 'Highest score ever recorded in Daily India Challenge! ' || v_state || ' celebrates!';
  END CASE;
  
  -- Insert the moment
  INSERT INTO tournament_moments (
    challenge_id, 
    moment_type, 
    title, 
    description, 
    participant_id, 
    state,
    participants_count,
    current_leader,
    is_viral
  )
  VALUES (
    p_challenge_id,
    p_moment_type,
    v_title,
    v_description,
    p_participant_id,
    v_state,
    (SELECT total_participants FROM daily_challenges WHERE id = p_challenge_id),
    (SELECT state FROM state_leaderboards WHERE challenge_id = p_challenge_id ORDER BY average_score DESC LIMIT 1),
    p_moment_type IN ('upset', 'record') -- These moments are likely to go viral
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate rankings when challenge ends
CREATE OR REPLACE FUNCTION trigger_challenge_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'live' THEN
    -- Calculate all rankings
    PERFORM calculate_state_rankings(NEW.id);
    
    -- Generate completion moment
    PERFORM generate_tournament_moment(
      NEW.id, 
      'milestone', 
      NULL, 
      'Daily India Challenge Complete!'
    );
    
    -- Update daily stats
    INSERT INTO daily_stats (
      challenge_date,
      total_participants,
      total_revenue,
      winning_state
    )
    VALUES (
      NEW.challenge_date,
      NEW.total_participants,
      NEW.total_revenue,
      (SELECT state FROM state_leaderboards WHERE challenge_id = NEW.id ORDER BY average_score DESC LIMIT 1)
    )
    ON CONFLICT (challenge_date) DO UPDATE SET
      total_participants = EXCLUDED.total_participants,
      total_revenue = EXCLUDED.total_revenue,
      winning_state = EXCLUDED.winning_state;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_challenge_completion_handler
  AFTER UPDATE ON daily_challenges
  FOR EACH ROW
  EXECUTE FUNCTION trigger_challenge_completion();

-- Insert today's challenge as example
INSERT INTO daily_challenges (
  challenge_date,
  title,
  description,
  topic,
  start_time,
  end_time,
  total_prize_pool,
  sponsor_name,
  questions,
  total_questions
)
VALUES (
  CURRENT_DATE,
  '🇮🇳 Tonight''s India Challenge: Republic Day Special!',
  'Test your knowledge about Indian Independence, Constitution, and Republic Day traditions!',
  'Indian History & Civics',
  CURRENT_DATE + INTERVAL '21 hours', -- 9 PM today
  CURRENT_DATE + INTERVAL '21 hours 30 minutes', -- 9:30 PM today
  25000, -- ₹25,000 Republic Day Special Prize Pool!
  'MindGains AI',
  '[
    {
      "id": 1,
      "question": "On which date did India become a Republic?",
      "options": ["15th August 1947", "26th January 1950", "2nd October 1869", "26th November 1949"],
      "correct_answer": 1,
      "explanation": "India became a Republic on 26th January 1950 when the Constitution came into effect.",
      "difficulty": "easy",
      "time_limit": 30
    },
    {
      "id": 2,
      "question": "Who was the first President of India?",
      "options": ["Mahatma Gandhi", "Jawaharlal Nehru", "Dr. Rajendra Prasad", "Dr. APJ Abdul Kalam"],
      "correct_answer": 2,
      "explanation": "Dr. Rajendra Prasad was India''s first President from 1950 to 1962.",
      "difficulty": "easy",
      "time_limit": 30
    }
  ]',
  20
)
ON CONFLICT (challenge_date) DO NOTHING;

-- Success message
SELECT '🚀 Daily India Challenge System Deployed Successfully!' as status,
       '🎯 Ready to make 10 million Indians compete daily at 9 PM!' as mission,
       '💰 Projected Revenue: ₹100+ crores annually' as vision;