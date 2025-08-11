/*
  # Indian Subjects and Topics System

  1. New Tables
    - `indian_subjects` - Core Indian exam subjects
    - `subject_topics` - Important topics for each subject  
    - `topic_questions` - Quiz questions for each topic
    - `user_topic_progress` - Track user progress per topic

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access and admin management
    - Special admin access for ragularvind84@gmail.com

  3. Data Structure
    - 6 main Indian subjects with 5 important topics each
    - 20 quiz questions per topic (120 total per subject)
    - Progress tracking per user per topic
*/

-- Create indian_subjects table
CREATE TABLE IF NOT EXISTS indian_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#8b5cf6',
  exam_importance text,
  total_topics integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subject_topics table
CREATE TABLE IF NOT EXISTS subject_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES indian_subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  importance_level text DEFAULT 'high' CHECK (importance_level IN ('high', 'medium', 'low')),
  exam_frequency text DEFAULT 'frequent' CHECK (exam_frequency IN ('frequent', 'moderate', 'rare')),
  total_questions integer DEFAULT 20,
  difficulty_distribution jsonb DEFAULT '{"easy": 8, "medium": 8, "hard": 4}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subject_id, name)
);

-- Create topic_questions table
CREATE TABLE IF NOT EXISTS topic_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES subject_topics(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  explanation text NOT NULL,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points integer DEFAULT 10,
  exam_relevance text,
  source text,
  tags text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_topic_progress table
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES subject_topics(id) ON DELETE CASCADE,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  best_score integer DEFAULT 0,
  total_time_spent integer DEFAULT 0,
  last_attempted timestamptz,
  proficiency_level text DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  weak_areas text[],
  strong_areas text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subject_topics_subject_id ON subject_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topic_questions_topic_id ON topic_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_questions_difficulty ON topic_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic_id ON user_topic_progress(topic_id);

-- Enable RLS
ALTER TABLE indian_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for indian_subjects
CREATE POLICY "Anyone can view active subjects"
  ON indian_subjects
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admin can manage subjects"
  ON indian_subjects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'ragularvind84@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'ragularvind84@gmail.com'
    )
  );

-- RLS Policies for subject_topics
CREATE POLICY "Anyone can view active topics"
  ON subject_topics
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admin can manage topics"
  ON subject_topics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'ragularvind84@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'ragularvind84@gmail.com'
    )
  );

-- RLS Policies for topic_questions
CREATE POLICY "Anyone can view active questions"
  ON topic_questions
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admin can manage questions"
  ON topic_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'ragularvind84@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'ragularvind84@gmail.com'
    )
  );

-- RLS Policies for user_topic_progress
CREATE POLICY "Users can view own progress"
  ON user_topic_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_topic_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all progress"
  ON user_topic_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'ragularvind84@gmail.com'
    )
  );

-- Insert Indian subjects
INSERT INTO indian_subjects (name, description, icon, color, exam_importance) VALUES
('History', 'Ancient, Medieval & Modern Indian History', '🏛️', '#8b5cf6', 'Critical for UPSC, SSC, State PCS - 25% weightage'),
('Polity', 'Indian Constitution, Governance & Political System', '⚖️', '#3b82f6', 'Highest weightage in UPSC - 30% of GS Paper'),
('Geography', 'Physical & Economic Geography of India', '🌍', '#10b981', 'Important for all competitive exams - 20% weightage'),
('Economy', 'Indian Economic Development & Policy', '💰', '#f59e0b', 'Growing importance in all exams - 25% weightage'),
('Science & Technology', 'Latest Scientific & Technological Developments', '🔬', '#06b6d4', 'Current affairs component - 15% weightage'),
('Current Affairs', 'Recent Indian & International Developments', '📰', '#ec4899', 'Dynamic component - 20% weightage across all exams')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  exam_importance = EXCLUDED.exam_importance,
  updated_at = now();

-- Insert History topics
INSERT INTO subject_topics (subject_id, name, description, importance_level, exam_frequency) 
SELECT 
  s.id,
  topic.name,
  topic.description,
  topic.importance_level,
  topic.exam_frequency
FROM indian_subjects s,
(VALUES 
  ('Ancient Indian Civilization', 'Indus Valley, Vedic Period, Mauryan & Gupta Empires', 'high', 'frequent'),
  ('Medieval Indian History', 'Delhi Sultanate, Mughal Empire, Regional Kingdoms', 'high', 'frequent'),
  ('Modern Indian History', 'British Rule, Freedom Struggle, Independence Movement', 'high', 'frequent'),
  ('Indian Freedom Fighters', 'Mahatma Gandhi, Nehru, Subhas Bose, Revolutionary Leaders', 'high', 'frequent'),
  ('Post-Independence India', 'Integration of States, Economic Policies, Major Events', 'high', 'frequent')
) AS topic(name, description, importance_level, exam_frequency)
WHERE s.name = 'History'
ON CONFLICT (subject_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  importance_level = EXCLUDED.importance_level,
  exam_frequency = EXCLUDED.exam_frequency,
  updated_at = now();

-- Insert Polity topics
INSERT INTO subject_topics (subject_id, name, description, importance_level, exam_frequency)
SELECT 
  s.id,
  topic.name,
  topic.description,
  topic.importance_level,
  topic.exam_frequency
FROM indian_subjects s,
(VALUES 
  ('Indian Constitution Basics', 'Preamble, Features, Making of Constitution', 'high', 'frequent'),
  ('Fundamental Rights & Duties', 'Articles 12-35, Fundamental Duties, Constitutional Remedies', 'high', 'frequent'),
  ('Directive Principles (DPSP)', 'Articles 36-51, State Policy Guidelines, Gandhian Principles', 'high', 'frequent'),
  ('Union Government Structure', 'President, Prime Minister, Parliament, Supreme Court', 'high', 'frequent'),
  ('State Government & Local Bodies', 'Governor, CM, State Legislature, Panchayati Raj, Municipalities', 'high', 'frequent')
) AS topic(name, description, importance_level, exam_frequency)
WHERE s.name = 'Polity'
ON CONFLICT (subject_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  importance_level = EXCLUDED.importance_level,
  exam_frequency = EXCLUDED.exam_frequency,
  updated_at = now();

-- Insert Geography topics
INSERT INTO subject_topics (subject_id, name, description, importance_level, exam_frequency)
SELECT 
  s.id,
  topic.name,
  topic.description,
  topic.importance_level,
  topic.exam_frequency
FROM indian_subjects s,
(VALUES 
  ('Physical Features of India', 'Mountains, Plateaus, Plains, Coastal Areas, Islands', 'high', 'frequent'),
  ('Indian Climate & Monsoons', 'Climate Types, Monsoon System, Weather Patterns', 'high', 'frequent'),
  ('Indian Rivers & Water Resources', 'Major Rivers, Tributaries, Water Disputes, Conservation', 'high', 'frequent'),
  ('Natural Resources & Minerals', 'Coal, Iron, Petroleum, Renewable Energy, Mining', 'high', 'frequent'),
  ('Agriculture & Food Security', 'Crops, Green Revolution, Food Processing, Rural Development', 'high', 'frequent')
) AS topic(name, description, importance_level, exam_frequency)
WHERE s.name = 'Geography'
ON CONFLICT (subject_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  importance_level = EXCLUDED.importance_level,
  exam_frequency = EXCLUDED.exam_frequency,
  updated_at = now();

-- Insert Economy topics
INSERT INTO subject_topics (subject_id, name, description, importance_level, exam_frequency)
SELECT 
  s.id,
  topic.name,
  topic.description,
  topic.importance_level,
  topic.exam_frequency
FROM indian_subjects s,
(VALUES 
  ('Indian Economic Development', 'Five Year Plans, Economic Reforms, Growth Models', 'high', 'frequent'),
  ('Banking & Financial System', 'RBI, Commercial Banks, Financial Institutions, Digital Banking', 'high', 'frequent'),
  ('Government Budgets & Taxation', 'Union Budget, Tax Structure, Fiscal Policy, GST', 'high', 'frequent'),
  ('Trade & Commerce', 'International Trade, WTO, Export-Import, Trade Agreements', 'high', 'frequent'),
  ('Economic Schemes & Programs', 'Poverty Alleviation, Employment Schemes, Social Security', 'high', 'frequent')
) AS topic(name, description, importance_level, exam_frequency)
WHERE s.name = 'Economy'
ON CONFLICT (subject_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  importance_level = EXCLUDED.importance_level,
  exam_frequency = EXCLUDED.exam_frequency,
  updated_at = now();

-- Insert Science & Technology topics
INSERT INTO subject_topics (subject_id, name, description, importance_level, exam_frequency)
SELECT 
  s.id,
  topic.name,
  topic.description,
  topic.importance_level,
  topic.exam_frequency
FROM indian_subjects s,
(VALUES 
  ('Indian Space Program', 'ISRO Missions, Satellites, Mars Mission, Chandrayaan', 'high', 'frequent'),
  ('Nuclear Technology', 'Nuclear Power, Atomic Energy, Nuclear Agreements', 'high', 'frequent'),
  ('Information Technology', 'Digital India, IT Industry, Cyber Security, AI Development', 'high', 'frequent'),
  ('Biotechnology & Medicine', 'Medical Research, Biotechnology Applications, Health Programs', 'high', 'frequent'),
  ('Defense Technology', 'Indigenous Defense Production, Missile Technology, Military Innovations', 'high', 'frequent')
) AS topic(name, description, importance_level, exam_frequency)
WHERE s.name = 'Science & Technology'
ON CONFLICT (subject_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  importance_level = EXCLUDED.importance_level,
  exam_frequency = EXCLUDED.exam_frequency,
  updated_at = now();

-- Insert Current Affairs topics
INSERT INTO subject_topics (subject_id, name, description, importance_level, exam_frequency)
SELECT 
  s.id,
  topic.name,
  topic.description,
  topic.importance_level,
  topic.exam_frequency
FROM indian_subjects s,
(VALUES 
  ('Government Schemes & Policies', 'Latest Government Initiatives, Policy Changes, Welfare Schemes', 'high', 'frequent'),
  ('International Relations', 'Bilateral Relations, International Organizations, Treaties', 'high', 'frequent'),
  ('Awards & Recognitions', 'National & International Awards, Honors, Achievements', 'high', 'frequent'),
  ('Sports & Culture', 'Sports Events, Cultural Programs, Art & Literature', 'medium', 'moderate'),
  ('Environment & Climate', 'Climate Change, Environmental Policies, Conservation Efforts', 'high', 'frequent')
) AS topic(name, description, importance_level, exam_frequency)
WHERE s.name = 'Current Affairs'
ON CONFLICT (subject_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  importance_level = EXCLUDED.importance_level,
  exam_frequency = EXCLUDED.exam_frequency,
  updated_at = now();