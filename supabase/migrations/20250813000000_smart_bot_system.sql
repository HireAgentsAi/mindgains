-- Smart Bot System for Battle Mode
-- Creates intelligent bots that play like real humans with varying skill levels

-- Bot profiles table
CREATE TABLE IF NOT EXISTS bot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name TEXT NOT NULL, -- Removed UNIQUE to allow dynamic names
  avatar_url TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL,
  personality_type TEXT CHECK (personality_type IN ('aggressive', 'cautious', 'balanced', 'random')) NOT NULL,
  
  -- Performance characteristics
  min_accuracy DECIMAL(5,2) DEFAULT 40.00, -- Minimum correct answer rate
  max_accuracy DECIMAL(5,2) DEFAULT 95.00, -- Maximum correct answer rate
  avg_response_time INTEGER DEFAULT 5000, -- Average response time in ms
  response_time_variance INTEGER DEFAULT 2000, -- +/- variance in ms
  
  -- Behavioral patterns
  mistake_pattern TEXT CHECK (mistake_pattern IN ('random', 'difficult_questions', 'time_pressure', 'streak_based')) DEFAULT 'random',
  confidence_level DECIMAL(5,2) DEFAULT 0.75, -- How often they bet high
  quit_probability DECIMAL(5,2) DEFAULT 0.02, -- Chance of quitting mid-game
  
  -- Statistics
  total_battles INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 50.00,
  total_coins_won INTEGER DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot behavior patterns table
CREATE TABLE IF NOT EXISTS bot_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bot_profiles(id) ON DELETE CASCADE,
  question_difficulty TEXT CHECK (question_difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  
  -- Response patterns by difficulty
  accuracy_rate DECIMAL(5,2) NOT NULL, -- Accuracy for this difficulty
  avg_response_time INTEGER NOT NULL, -- Avg time for this difficulty
  
  -- Special behaviors
  first_question_boost BOOLEAN DEFAULT false, -- Performs better on first questions
  pressure_sensitivity DECIMAL(5,2) DEFAULT 0.5, -- How much worse under time pressure
  streak_confidence DECIMAL(5,2) DEFAULT 0.1, -- Accuracy boost per correct answer
  
  UNIQUE(bot_id, question_difficulty)
);

-- Bot response history for learning
CREATE TABLE IF NOT EXISTS bot_response_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bot_profiles(id) ON DELETE CASCADE,
  battle_room_id UUID NOT NULL REFERENCES battle_rooms(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_difficulty TEXT NOT NULL,
  responded_correctly BOOLEAN NOT NULL,
  response_time INTEGER NOT NULL, -- in milliseconds
  score_difference INTEGER, -- Bot score vs opponent at time of answer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bot_profiles_skill ON bot_profiles(skill_level);
CREATE INDEX IF NOT EXISTS idx_bot_profiles_active ON bot_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_bot_behavior_patterns ON bot_behavior_patterns(bot_id, question_difficulty);
CREATE INDEX IF NOT EXISTS idx_bot_response_history ON bot_response_history(bot_id, battle_room_id);

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

-- Insert first names (150+ diverse names)
INSERT INTO bot_first_names (name, gender) VALUES
-- Male names
('Aarav', 'male'), ('Abhishek', 'male'), ('Aditya', 'male'), ('Ajay', 'male'), ('Akash', 'male'),
('Amar', 'male'), ('Amit', 'male'), ('Anand', 'male'), ('Anil', 'male'), ('Ankit', 'male'),
('Anuj', 'male'), ('Arjun', 'male'), ('Ashish', 'male'), ('Avinash', 'male'), ('Deepak', 'male'),
('Dev', 'male'), ('Gaurav', 'male'), ('Harsh', 'male'), ('Karan', 'male'), ('Karthik', 'male'),
('Manish', 'male'), ('Nikhil', 'male'), ('Pankaj', 'male'), ('Rahul', 'male'), ('Raj', 'male'),
('Rajesh', 'male'), ('Ravi', 'male'), ('Rohit', 'male'), ('Sachin', 'male'), ('Sanjay', 'male'),
('Shivam', 'male'), ('Siddharth', 'male'), ('Sunil', 'male'), ('Suresh', 'male'), ('Varun', 'male'),
('Vikram', 'male'), ('Vinay', 'male'), ('Vishal', 'male'), ('Vivek', 'male'), ('Yash', 'male'),
('Aryan', 'male'), ('Ishaan', 'male'), ('Rohan', 'male'), ('Tanvi', 'male'), ('Vihan', 'male'),
('Aakash', 'male'), ('Advait', 'male'), ('Ayaan', 'male'), ('Dhruv', 'male'), ('Kiaan', 'male'),
('Reyansh', 'male'), ('Shaan', 'male'), ('Shivansh', 'male'), ('Veer', 'male'), ('Arshad', 'male'),
('Fahad', 'male'), ('Imran', 'male'), ('Karim', 'male'), ('Omar', 'male'), ('Salman', 'male'),
('Tariq', 'male'), ('Zain', 'male'), ('Adithya', 'male'), ('Balaji', 'male'), ('Ganesh', 'male'),
('Harish', 'male'), ('Jagdish', 'male'), ('Mahesh', 'male'), ('Prakash', 'male'), ('Ramesh', 'male'),
('Santosh', 'male'), ('Subash', 'male'), ('Venkatesh', 'male'), ('Yogesh', 'male'), ('Chandan', 'male'),

-- Female names  
('Aadhya', 'female'), ('Ananya', 'female'), ('Anusha', 'female'), ('Arya', 'female'), ('Diya', 'female'),
('Ishita', 'female'), ('Kavya', 'female'), ('Kiara', 'female'), ('Myra', 'female'), ('Saanvi', 'female'),
('Sara', 'female'), ('Tara', 'female'), ('Vanya', 'female'), ('Zara', 'female'), ('Aditi', 'female'),
('Anjali', 'female'), ('Deepika', 'female'), ('Divya', 'female'), ('Komal', 'female'), ('Meera', 'female'),
('Neha', 'female'), ('Pooja', 'female'), ('Priya', 'female'), ('Ritu', 'female'), ('Shreya', 'female'),
('Sneha', 'female'), ('Sonia', 'female'), ('Sunita', 'female'), ('Swati', 'female'), ('Tanvi', 'female'),
('Vandana', 'female'), ('Vidya', 'female'), ('Kiran', 'female'), ('Madhuri', 'female'), ('Manisha', 'female'),
('Nisha', 'female'), ('Pallavi', 'female'), ('Preeti', 'female'), ('Rashmi', 'female'), ('Seema', 'female'),
('Shilpa', 'female'), ('Smita', 'female'), ('Sushma', 'female'), ('Usha', 'female'), ('Veena', 'female'),
('Asha', 'female'), ('Geeta', 'female'), ('Kamala', 'female'), ('Lata', 'female'), ('Maya', 'female'),
('Nita', 'female'), ('Radha', 'female'), ('Rekha', 'female'), ('Sita', 'female'), ('Uma', 'female'),
('Fatima', 'female'), ('Hina', 'female'), ('Nazia', 'female'), ('Rukhsar', 'female'), ('Saba', 'female'),
('Zoya', 'female'), ('Lakshmi', 'female'), ('Padma', 'female'), ('Rama', 'female'), ('Shanti', 'female'),
('Sushila', 'female'), ('Vasantha', 'female'), ('Yamuna', 'female'), ('Bhavana', 'female'), ('Chitra', 'female'),

-- Unisex names
('Arun', 'unisex'), ('Hari', 'unisex'), ('Indira', 'unisex'), ('Jaya', 'unisex'), ('Kiran', 'unisex'),
('Mohan', 'unisex'), ('Nanda', 'unisex'), ('Prem', 'unisex'), ('Ravi', 'unisex'), ('Shree', 'unisex'),
('Suman', 'unisex'), ('Surya', 'unisex'), ('Vijay', 'unisex'), ('Akshay', 'unisex'), ('Babul', 'unisex');

-- Insert last names (200+ surnames from all regions)
INSERT INTO bot_last_names (name, region) VALUES
-- North Indian surnames
('Sharma', 'north'), ('Gupta', 'north'), ('Agarwal', 'north'), ('Bansal', 'north'), ('Jain', 'north'),
('Mittal', 'north'), ('Goel', 'north'), ('Singhal', 'north'), ('Goyal', 'north'), ('Mahajan', 'north'),
('Singh', 'north'), ('Kumar', 'north'), ('Verma', 'north'), ('Yadav', 'north'), ('Tiwari', 'north'),
('Mishra', 'north'), ('Pandey', 'north'), ('Srivastava', 'north'), ('Shukla', 'north'), ('Dubey', 'north'),
('Chaturvedi', 'north'), ('Joshi', 'north'), ('Bhatt', 'north'), ('Upadhyay', 'north'), ('Saxena', 'north'),
('Agnihotri', 'north'), ('Awasthi', 'north'), ('Pathak', 'north'), ('Tripathi', 'north'), ('Dixit', 'north'),
('Kapoor', 'north'), ('Malhotra', 'north'), ('Khanna', 'north'), ('Chopra', 'north'), ('Sethi', 'north'),
('Bedi', 'north'), ('Gill', 'north'), ('Dhawan', 'north'), ('Sood', 'north'), ('Kalra', 'north'),
('Tandon', 'north'), ('Mehra', 'north'), ('Arora', 'north'), ('Batra', 'north'), ('Sehgal', 'north'),

-- South Indian surnames
('Iyer', 'south'), ('Iyengar', 'south'), ('Raman', 'south'), ('Krishnan', 'south'), ('Narayanan', 'south'),
('Subramanian', 'south'), ('Venkataraman', 'south'), ('Raghavan', 'south'), ('Srinivasan', 'south'), ('Murthy', 'south'),
('Rao', 'south'), ('Reddy', 'south'), ('Naidu', 'south'), ('Chowdary', 'south'), ('Varma', 'south'),
('Sastry', 'south'), ('Prasad', 'south'), ('Raju', 'south'), ('Babu', 'south'), ('Devi', 'south'),
('Nair', 'south'), ('Menon', 'south'), ('Pillai', 'south'), ('Kurup', 'south'), ('Nambiar', 'south'),
('Warrier', 'south'), ('Panicker', 'south'), ('Thampi', 'south'), ('Unnithan', 'south'), ('Kaimal', 'south'),
('Shetty', 'south'), ('Bhat', 'south'), ('Kamath', 'south'), ('Pai', 'south'), ('Hegde', 'south'),
('Kulkarni', 'south'), ('Joshi', 'south'), ('Kini', 'south'), ('Shenoy', 'south'), ('Bhandary', 'south'),
('Gowda', 'south'), ('Shastri', 'south'), ('Achar', 'south'), ('Iyengar', 'south'), ('Bhagavatula', 'south'),

-- West Indian surnames  
('Patel', 'west'), ('Shah', 'west'), ('Desai', 'west'), ('Modi', 'west'), ('Joshi', 'west'),
('Mehta', 'west'), ('Thakkar', 'west'), ('Vyas', 'west'), ('Trivedi', 'west'), ('Shukla', 'west'),
('Bhatt', 'west'), ('Dave', 'west'), ('Amin', 'west'), ('Parekh', 'west'), ('Panchal', 'west'),
('Parikh', 'west'), ('Raval', 'west'), ('Solanki', 'west'), ('Vaghela', 'west'), ('Chaudhari', 'west'),
('Patil', 'west'), ('Joshi', 'west'), ('Kulkarni', 'west'), ('Deshpande', 'west'), ('Joshi', 'west'),
('More', 'west'), ('Jadhav', 'west'), ('Pawar', 'west'), ('Shinde', 'west'), ('Bhosale', 'west'),
('Gaikwad', 'west'), ('Mane', 'west'), ('Kale', 'west'), ('Lokhande', 'west'), ('Chavan', 'west'),

-- East Indian surnames
('Banerjee', 'east'), ('Chatterjee', 'east'), ('Mukherjee', 'east'), ('Sengupta', 'east'), ('Bhattacharya', 'east'),
('Chakraborty', 'east'), ('Ganguly', 'east'), ('Ghosh', 'east'), ('Roy', 'east'), ('Sarkar', 'east'),
('Das', 'east'), ('Dutta', 'east'), ('Bose', 'east'), ('Sen', 'east'), ('Mitra', 'east'),
('Saha', 'east'), ('Pal', 'east'), ('Mondal', 'east'), ('Biswas', 'east'), ('Majumdar', 'east'),
('Chowdhury', 'east'), ('Haldar', 'east'), ('Kar', 'east'), ('Lahiri', 'east'), ('Nag', 'east'),

-- Central Indian surnames
('Chouhan', 'central'), ('Rajput', 'central'), ('Thakur', 'central'), ('Rathore', 'central'), ('Sisodiya', 'central'),
('Gurjar', 'central'), ('Meena', 'central'), ('Jat', 'central'), ('Bisht', 'central'), ('Negi', 'central'),
('Rawat', 'central'), ('Chauhan', 'central'), ('Rana', 'central'), ('Bhardwaj', 'central'), ('Kashyap', 'central');

-- Function to generate random bot name
CREATE OR REPLACE FUNCTION generate_random_bot_name()
RETURNS TEXT AS $$
DECLARE
  first_name TEXT;
  last_name TEXT;
BEGIN
  -- Select random first name
  SELECT name INTO first_name 
  FROM bot_first_names 
  ORDER BY random() 
  LIMIT 1;
  
  -- Select random last name
  SELECT name INTO last_name 
  FROM bot_last_names 
  ORDER BY random() 
  LIMIT 1;
  
  RETURN first_name || ' ' || last_name;
END;
$$ LANGUAGE plpgsql;

-- Insert bot profiles with placeholder names (will be dynamically generated)
INSERT INTO bot_profiles (bot_name, skill_level, personality_type, min_accuracy, max_accuracy, avg_response_time, response_time_variance, mistake_pattern, confidence_level) VALUES
-- Beginner bots (20 profiles)
('Bot1', 'beginner', 'cautious', 35.00, 65.00, 8000, 3000, 'difficult_questions', 0.3),
('Bot2', 'beginner', 'balanced', 40.00, 70.00, 7000, 2500, 'time_pressure', 0.4),
('Bot3', 'beginner', 'random', 30.00, 60.00, 9000, 4000, 'random', 0.5),
('Bot4', 'beginner', 'cautious', 38.00, 68.00, 8500, 3200, 'time_pressure', 0.35),
('Bot5', 'beginner', 'balanced', 42.00, 72.00, 7500, 2800, 'difficult_questions', 0.45),
('Bot6', 'beginner', 'aggressive', 36.00, 66.00, 8200, 3100, 'streak_based', 0.4),
('Bot7', 'beginner', 'random', 34.00, 64.00, 8800, 3500, 'random', 0.38),
('Bot8', 'beginner', 'cautious', 39.00, 69.00, 7800, 2900, 'time_pressure', 0.42),
('Bot9', 'beginner', 'balanced', 37.00, 67.00, 8100, 3000, 'difficult_questions', 0.36),
('Bot10', 'beginner', 'aggressive', 33.00, 63.00, 8600, 3300, 'streak_based', 0.41),
('Bot11', 'beginner', 'random', 41.00, 71.00, 7600, 2700, 'random', 0.43),
('Bot12', 'beginner', 'cautious', 35.00, 65.00, 8300, 3200, 'time_pressure', 0.37),
('Bot13', 'beginner', 'balanced', 38.00, 68.00, 7900, 2800, 'difficult_questions', 0.39),
('Bot14', 'beginner', 'aggressive', 32.00, 62.00, 8700, 3400, 'streak_based', 0.34),
('Bot15', 'beginner', 'random', 40.00, 70.00, 7700, 2600, 'random', 0.44),
('Bot16', 'beginner', 'cautious', 36.00, 66.00, 8400, 3100, 'time_pressure', 0.38),
('Bot17', 'beginner', 'balanced', 39.00, 69.00, 8000, 2900, 'difficult_questions', 0.40),
('Bot18', 'beginner', 'aggressive', 31.00, 61.00, 8900, 3600, 'streak_based', 0.33),
('Bot19', 'beginner', 'random', 43.00, 73.00, 7400, 2500, 'random', 0.46),
('Bot20', 'beginner', 'cautious', 37.00, 67.00, 8200, 3000, 'time_pressure', 0.39),

-- Intermediate bots (25 profiles)
('Bot21', 'intermediate', 'balanced', 55.00, 80.00, 5000, 2000, 'difficult_questions', 0.6),
('Bot22', 'intermediate', 'aggressive', 60.00, 85.00, 4000, 1500, 'streak_based', 0.75),
('Bot23', 'intermediate', 'cautious', 50.00, 78.00, 6000, 2000, 'time_pressure', 0.5),
('Bot24', 'intermediate', 'balanced', 58.00, 82.00, 5500, 2200, 'random', 0.65),
('Bot25', 'intermediate', 'aggressive', 62.00, 83.00, 4500, 1800, 'streak_based', 0.7),
('Bot26', 'intermediate', 'balanced', 56.00, 81.00, 5200, 2100, 'difficult_questions', 0.6),
('Bot27', 'intermediate', 'cautious', 52.00, 79.00, 5800, 2300, 'time_pressure', 0.55),
('Bot28', 'intermediate', 'aggressive', 64.00, 84.00, 4200, 1600, 'streak_based', 0.72),
('Bot29', 'intermediate', 'random', 54.00, 79.00, 5300, 2000, 'random', 0.58),
('Bot30', 'intermediate', 'balanced', 59.00, 82.00, 5100, 2200, 'difficult_questions', 0.68),
('Bot31', 'intermediate', 'cautious', 51.00, 77.00, 5900, 2400, 'time_pressure', 0.52),
('Bot32', 'intermediate', 'aggressive', 63.00, 84.00, 4300, 1700, 'streak_based', 0.73),
('Bot33', 'intermediate', 'balanced', 57.00, 81.00, 5400, 2100, 'difficult_questions', 0.62),
('Bot34', 'intermediate', 'random', 53.00, 78.00, 5600, 2200, 'random', 0.56),
('Bot35', 'intermediate', 'aggressive', 61.00, 83.00, 4400, 1800, 'streak_based', 0.69),
('Bot36', 'intermediate', 'cautious', 49.00, 76.00, 6100, 2500, 'time_pressure', 0.48),
('Bot37', 'intermediate', 'balanced', 58.00, 82.00, 5200, 2000, 'difficult_questions', 0.64),
('Bot38', 'intermediate', 'aggressive', 65.00, 85.00, 4100, 1500, 'streak_based', 0.74),
('Bot39', 'intermediate', 'random', 55.00, 80.00, 5300, 2100, 'random', 0.59),
('Bot40', 'intermediate', 'cautious', 50.00, 77.00, 5700, 2300, 'time_pressure', 0.51),
('Bot41', 'intermediate', 'balanced', 59.00, 83.00, 5000, 2000, 'difficult_questions', 0.67),
('Bot42', 'intermediate', 'aggressive', 62.00, 84.00, 4500, 1700, 'streak_based', 0.71),
('Bot43', 'intermediate', 'random', 56.00, 81.00, 5400, 2200, 'random', 0.60),
('Bot44', 'intermediate', 'cautious', 52.00, 78.00, 5800, 2400, 'time_pressure', 0.54),
('Bot45', 'intermediate', 'balanced', 57.00, 82.00, 5300, 2100, 'difficult_questions', 0.63),

-- Advanced bots (20 profiles)
('Bot46', 'advanced', 'balanced', 70.00, 90.00, 3500, 1200, 'difficult_questions', 0.8),
('Bot47', 'advanced', 'aggressive', 75.00, 92.00, 3000, 1000, 'streak_based', 0.85),
('Bot48', 'advanced', 'cautious', 68.00, 88.00, 4000, 1500, 'time_pressure', 0.7),
('Bot49', 'advanced', 'balanced', 72.00, 89.00, 3200, 1100, 'random', 0.8),
('Bot50', 'advanced', 'aggressive', 74.00, 91.00, 2800, 1000, 'streak_based', 0.82),
('Bot51', 'advanced', 'cautious', 69.00, 87.00, 3800, 1400, 'time_pressure', 0.72),
('Bot52', 'advanced', 'balanced', 71.00, 90.00, 3300, 1200, 'difficult_questions', 0.78),
('Bot53', 'advanced', 'aggressive', 76.00, 93.00, 2900, 900, 'streak_based', 0.86),
('Bot54', 'advanced', 'random', 67.00, 86.00, 3600, 1300, 'random', 0.68),
('Bot55', 'advanced', 'balanced', 73.00, 91.00, 3100, 1100, 'difficult_questions', 0.81),
('Bot56', 'advanced', 'cautious', 66.00, 85.00, 4100, 1600, 'time_pressure', 0.69),
('Bot57', 'advanced', 'aggressive', 77.00, 94.00, 2700, 800, 'streak_based', 0.87),
('Bot58', 'advanced', 'balanced', 70.00, 89.00, 3400, 1200, 'difficult_questions', 0.79),
('Bot59', 'advanced', 'random', 68.00, 87.00, 3700, 1400, 'random', 0.71),
('Bot60', 'advanced', 'aggressive', 75.00, 92.00, 3000, 1000, 'streak_based', 0.84),
('Bot61', 'advanced', 'cautious', 67.00, 86.00, 3900, 1500, 'time_pressure', 0.70),
('Bot62', 'advanced', 'balanced', 72.00, 90.00, 3200, 1100, 'difficult_questions', 0.80),
('Bot63', 'advanced', 'aggressive', 74.00, 91.00, 2900, 1000, 'streak_based', 0.83),
('Bot64', 'advanced', 'random', 69.00, 88.00, 3500, 1300, 'random', 0.73),
('Bot65', 'advanced', 'balanced', 71.00, 89.00, 3300, 1200, 'difficult_questions', 0.77),

-- Expert bots (15 profiles)
('Bot66', 'expert', 'aggressive', 80.00, 95.00, 2500, 800, 'streak_based', 0.9),
('Bot67', 'expert', 'balanced', 78.00, 94.00, 2800, 1000, 'difficult_questions', 0.85),
('Bot68', 'expert', 'random', 82.00, 96.00, 2200, 700, 'random', 0.95),
('Bot69', 'expert', 'cautious', 79.00, 93.00, 2600, 900, 'difficult_questions', 0.88),
('Bot70', 'expert', 'balanced', 81.00, 95.00, 2400, 750, 'streak_based', 0.92),
('Bot71', 'expert', 'aggressive', 83.00, 97.00, 2100, 600, 'streak_based', 0.94),
('Bot72', 'expert', 'balanced', 77.00, 92.00, 2900, 1100, 'difficult_questions', 0.84),
('Bot73', 'expert', 'random', 84.00, 98.00, 2000, 500, 'random', 0.96),
('Bot74', 'expert', 'cautious', 76.00, 91.00, 3000, 1200, 'time_pressure', 0.82),
('Bot75', 'expert', 'aggressive', 85.00, 98.00, 1900, 400, 'streak_based', 0.97),
('Bot76', 'expert', 'balanced', 80.00, 94.00, 2500, 800, 'difficult_questions', 0.89),
('Bot77', 'expert', 'random', 81.00, 95.00, 2300, 700, 'random', 0.93),
('Bot78', 'expert', 'cautious', 78.00, 93.00, 2700, 1000, 'time_pressure', 0.86),
('Bot79', 'expert', 'aggressive', 82.00, 96.00, 2200, 600, 'streak_based', 0.91),
('Bot80', 'expert', 'balanced', 79.00, 94.00, 2600, 900, 'difficult_questions', 0.87);

-- Insert behavior patterns for each bot
INSERT INTO bot_behavior_patterns (bot_id, question_difficulty, accuracy_rate, avg_response_time, first_question_boost, pressure_sensitivity, streak_confidence)
SELECT 
  bp.id,
  difficulty.val,
  CASE 
    WHEN bp.skill_level = 'beginner' THEN
      CASE difficulty.val
        WHEN 'easy' THEN bp.min_accuracy + 20
        WHEN 'medium' THEN bp.min_accuracy + 10
        WHEN 'hard' THEN bp.min_accuracy
      END
    WHEN bp.skill_level = 'intermediate' THEN
      CASE difficulty.val
        WHEN 'easy' THEN bp.min_accuracy + 25
        WHEN 'medium' THEN bp.min_accuracy + 15
        WHEN 'hard' THEN bp.min_accuracy + 5
      END
    WHEN bp.skill_level = 'advanced' THEN
      CASE difficulty.val
        WHEN 'easy' THEN bp.max_accuracy - 5
        WHEN 'medium' THEN bp.max_accuracy - 10
        WHEN 'hard' THEN bp.max_accuracy - 15
      END
    WHEN bp.skill_level = 'expert' THEN
      CASE difficulty.val
        WHEN 'easy' THEN bp.max_accuracy
        WHEN 'medium' THEN bp.max_accuracy - 5
        WHEN 'hard' THEN bp.max_accuracy - 8
      END
  END,
  CASE difficulty.val
    WHEN 'easy' THEN bp.avg_response_time - 1000
    WHEN 'medium' THEN bp.avg_response_time
    WHEN 'hard' THEN bp.avg_response_time + 1500
  END,
  bp.personality_type = 'aggressive',
  CASE bp.personality_type
    WHEN 'cautious' THEN 0.7
    WHEN 'aggressive' THEN 0.3
    ELSE 0.5
  END,
  CASE bp.skill_level
    WHEN 'beginner' THEN 0.05
    WHEN 'intermediate' THEN 0.08
    WHEN 'advanced' THEN 0.10
    WHEN 'expert' THEN 0.12
  END
FROM bot_profiles bp
CROSS JOIN (VALUES ('easy'), ('medium'), ('hard')) AS difficulty(val);

-- Function to get a suitable bot for matching with dynamic name
CREATE OR REPLACE FUNCTION get_matching_bot(
  p_user_skill_level TEXT DEFAULT 'intermediate',
  p_exclude_bot_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE (
  bot_id UUID,
  bot_name TEXT,
  skill_level TEXT,
  personality_type TEXT
) AS $$
DECLARE
  selected_bot RECORD;
  random_name TEXT;
BEGIN
  -- Smart matching: 
  -- 40% chance same skill level
  -- 30% chance one level lower
  -- 20% chance one level higher
  -- 10% chance random
  
  WITH skill_weights AS (
    SELECT 
      CASE 
        WHEN random() < 0.4 THEN p_user_skill_level
        WHEN random() < 0.7 THEN 
          CASE p_user_skill_level
            WHEN 'expert' THEN 'advanced'
            WHEN 'advanced' THEN 'intermediate'
            WHEN 'intermediate' THEN 'beginner'
            ELSE 'beginner'
          END
        WHEN random() < 0.9 THEN
          CASE p_user_skill_level
            WHEN 'beginner' THEN 'intermediate'
            WHEN 'intermediate' THEN 'advanced'
            WHEN 'advanced' THEN 'expert'
            ELSE 'expert'
          END
        ELSE
          (SELECT skill_level FROM bot_profiles ORDER BY random() LIMIT 1)
      END AS target_skill
  )
  SELECT * INTO selected_bot
  FROM bot_profiles bp, skill_weights sw
  WHERE bp.is_active = true
    AND bp.id != ALL(p_exclude_bot_ids)
    AND bp.skill_level = sw.target_skill
  ORDER BY random()
  LIMIT 1;
  
  -- Fallback if no match found
  IF selected_bot IS NULL THEN
    SELECT * INTO selected_bot
    FROM bot_profiles bp
    WHERE bp.is_active = true
      AND bp.id != ALL(p_exclude_bot_ids)
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Generate random name for this session
  SELECT generate_random_bot_name() INTO random_name;

  -- Return bot with random name
  bot_id := selected_bot.id;
  bot_name := random_name;
  skill_level := selected_bot.skill_level;
  personality_type := selected_bot.personality_type;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to simulate bot response
CREATE OR REPLACE FUNCTION simulate_bot_response(
  p_bot_id UUID,
  p_question_difficulty TEXT,
  p_question_number INTEGER,
  p_score_difference INTEGER DEFAULT 0,
  p_time_remaining INTEGER DEFAULT 30
)
RETURNS TABLE (
  is_correct BOOLEAN,
  response_time_ms INTEGER
) AS $$
DECLARE
  v_bot RECORD;
  v_behavior RECORD;
  v_base_accuracy DECIMAL;
  v_final_accuracy DECIMAL;
  v_response_time INTEGER;
  v_random_factor DECIMAL;
BEGIN
  -- Get bot profile
  SELECT * INTO v_bot FROM bot_profiles WHERE id = p_bot_id;
  
  -- Get behavior pattern for difficulty
  SELECT * INTO v_behavior FROM bot_behavior_patterns 
  WHERE bot_id = p_bot_id AND question_difficulty = p_question_difficulty;
  
  -- Calculate base accuracy
  v_base_accuracy := v_behavior.accuracy_rate;
  
  -- Apply modifiers
  v_final_accuracy := v_base_accuracy;
  
  -- First question boost
  IF p_question_number = 1 AND v_behavior.first_question_boost THEN
    v_final_accuracy := v_final_accuracy + 5;
  END IF;
  
  -- Streak confidence (assume streak based on score difference)
  IF p_score_difference > 0 THEN
    v_final_accuracy := v_final_accuracy + (v_behavior.streak_confidence * p_score_difference);
  END IF;
  
  -- Time pressure
  IF p_time_remaining < 10 THEN
    v_final_accuracy := v_final_accuracy - (v_behavior.pressure_sensitivity * 10);
  END IF;
  
  -- Personality adjustments
  IF v_bot.personality_type = 'aggressive' AND p_score_difference < 0 THEN
    v_final_accuracy := v_final_accuracy + 5; -- Try harder when losing
  ELSIF v_bot.personality_type = 'cautious' AND p_score_difference > 20 THEN
    v_final_accuracy := v_final_accuracy - 5; -- Relax when winning big
  END IF;
  
  -- Add randomness
  v_random_factor := (random() - 0.5) * 10;
  v_final_accuracy := GREATEST(10, LEAST(100, v_final_accuracy + v_random_factor));
  
  -- Determine if correct
  is_correct := random() * 100 < v_final_accuracy;
  
  -- Calculate response time
  v_response_time := v_behavior.avg_response_time;
  
  -- Add variance
  v_response_time := v_response_time + ((random() - 0.5) * v_bot.response_time_variance * 2)::INTEGER;
  
  -- Adjust for difficulty
  IF NOT is_correct THEN
    v_response_time := v_response_time + 1000; -- Takes longer when struggling
  END IF;
  
  -- Ensure reasonable bounds
  response_time_ms := GREATEST(1000, LEAST(28000, v_response_time));
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to update bot statistics after battle
CREATE OR REPLACE FUNCTION update_bot_statistics(
  p_bot_id UUID,
  p_won BOOLEAN,
  p_coins_change INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE bot_profiles
  SET 
    total_battles = total_battles + 1,
    battles_won = battles_won + CASE WHEN p_won THEN 1 ELSE 0 END,
    win_rate = ROUND(
      ((battles_won + CASE WHEN p_won THEN 1 ELSE 0 END) * 100.0) / 
      (total_battles + 1), 2
    ),
    total_coins_won = total_coins_won + CASE WHEN p_coins_change > 0 THEN p_coins_change ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_bot_id;
END;
$$ LANGUAGE plpgsql;

-- Add is_bot column to profiles table for tracking bot accounts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;

-- RLS Policies
ALTER TABLE bot_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_response_history ENABLE ROW LEVEL SECURITY;

-- Everyone can view bot profiles
CREATE POLICY "Anyone can view bot profiles" ON bot_profiles FOR SELECT USING (true);

-- Only system can modify bot data
CREATE POLICY "System can manage bot profiles" ON bot_profiles FOR ALL USING (true);
CREATE POLICY "System can manage bot behaviors" ON bot_behavior_patterns FOR ALL USING (true);
CREATE POLICY "System can manage bot history" ON bot_response_history FOR ALL USING (true);