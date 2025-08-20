-- Create battle system tables for real-time quiz battles with coin betting

-- Battle rooms table
CREATE TABLE IF NOT EXISTS battle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES subject_topics(id),
  subject_name TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  bet_amount INTEGER NOT NULL DEFAULT 100,
  max_participants INTEGER NOT NULL DEFAULT 2,
  current_participants INTEGER NOT NULL DEFAULT 1,
  status TEXT CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')) DEFAULT 'waiting',
  questions JSONB,
  room_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES profiles(id),
  time_limit INTEGER DEFAULT 30 -- seconds per question
);

-- Battle participants table
CREATE TABLE IF NOT EXISTS battle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_room_id UUID NOT NULL REFERENCES battle_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_score INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]',
  finished_at TIMESTAMP WITH TIME ZONE,
  coins_bet INTEGER NOT NULL,
  coins_won INTEGER DEFAULT 0,
  UNIQUE(battle_room_id, user_id)
);

-- Battle invites table
CREATE TABLE IF NOT EXISTS battle_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_room_id UUID NOT NULL REFERENCES battle_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_phone TEXT,
  recipient_id UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- User coins table (if not exists)
CREATE TABLE IF NOT EXISTS user_coins (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 1000,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle transactions table for coin transfers
CREATE TABLE IF NOT EXISTS battle_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_room_id UUID NOT NULL REFERENCES battle_rooms(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  transaction_type TEXT CHECK (transaction_type IN ('bet', 'win', 'refund')) NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_battle_rooms_status ON battle_rooms(status);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_host ON battle_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_room ON battle_participants(battle_room_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_user ON battle_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_invites_code ON battle_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_battle_transactions_user ON battle_transactions(user_id);

-- RLS policies
ALTER TABLE battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_transactions ENABLE ROW LEVEL SECURITY;

-- Battle rooms policies
CREATE POLICY "Users can view all battle rooms" ON battle_rooms FOR SELECT USING (true);
CREATE POLICY "Users can create battle rooms" ON battle_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update their battle rooms" ON battle_rooms FOR UPDATE USING (auth.uid() = host_id);

-- Battle participants policies
CREATE POLICY "Users can view battle participants" ON battle_participants FOR SELECT USING (true);
CREATE POLICY "Users can join battles" ON battle_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their participation" ON battle_participants FOR UPDATE USING (auth.uid() = user_id);

-- Battle invites policies
CREATE POLICY "Users can view their invites" ON battle_invites FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can create invites" ON battle_invites FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can update invites" ON battle_invites FOR UPDATE USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- User coins policies
CREATE POLICY "Users can view their coins" ON user_coins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their coins" ON user_coins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their coins" ON user_coins FOR UPDATE USING (auth.uid() = user_id);

-- Battle transactions policies
CREATE POLICY "Users can view their transactions" ON battle_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON battle_transactions FOR INSERT WITH CHECK (true);

-- Functions for battle operations

-- Function to generate room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Trigger to set room code on battle room creation
CREATE OR REPLACE FUNCTION set_battle_room_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.room_code IS NULL THEN
    NEW.room_code = generate_room_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_battle_room_code
  BEFORE INSERT ON battle_rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_battle_room_code();

-- Trigger to set invite code on battle invite creation
CREATE OR REPLACE FUNCTION set_battle_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code = generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_battle_invite_code
  BEFORE INSERT ON battle_invites
  FOR EACH ROW
  EXECUTE FUNCTION set_battle_invite_code();

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_battle_room_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE battle_rooms 
    SET current_participants = (
      SELECT COUNT(*) FROM battle_participants 
      WHERE battle_room_id = NEW.battle_room_id
    )
    WHERE id = NEW.battle_room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE battle_rooms 
    SET current_participants = (
      SELECT COUNT(*) FROM battle_participants 
      WHERE battle_room_id = OLD.battle_room_id
    )
    WHERE id = OLD.battle_room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_battle_room_participants
  AFTER INSERT OR DELETE ON battle_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_battle_room_participants();

-- Insert default coins for existing users
INSERT INTO user_coins (user_id, balance, total_earned)
SELECT id, 1000, 1000 FROM profiles
ON CONFLICT (user_id) DO NOTHING;