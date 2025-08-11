/*
  # Create Demo Data for MindGains AI

  1. Demo Subjects
    - UPSC, JEE/NEET, Banking, SSC subjects with proper icons and colors
  
  2. Demo Achievements
    - Learning, Speed, Streak, Social, Mastery achievements with proper rewards
  
  3. Demo User Profile and Stats
    - Sample user with realistic progress data
*/

-- Insert demo subjects
INSERT INTO subjects (name, description, icon, color) VALUES
('UPSC', 'Civil Services Examination - IAS, IPS, IFS', '🏛️', '#8b5cf6'),
('JEE/NEET', 'Engineering & Medical Entrance Exams', '🔬', '#10b981'),
('Banking', 'SBI, IBPS, RBI Banking Exams', '💰', '#fbbf24'),
('SSC', 'Staff Selection Commission Exams', '📝', '#3b82f6'),
('State PCS', 'State Public Service Commission', '🗺️', '#ec4899'),
('GATE', 'Graduate Aptitude Test in Engineering', '💻', '#06b6d4'),
('History', 'Ancient, Medieval & Modern Indian History', '📚', '#8b5cf6'),
('Geography', 'Physical, Human & Economic Geography', '🌍', '#10b981'),
('Science', 'Physics, Chemistry, Biology', '⚗️', '#fbbf24'),
('Mathematics', 'Quantitative Aptitude & Advanced Math', '📐', '#3b82f6'),
('English', 'Grammar, Comprehension & Writing Skills', '📖', '#ec4899'),
('General Studies', 'Current Affairs & General Knowledge', '🎯', '#06b6d4')
ON CONFLICT (name) DO NOTHING;

-- Insert demo achievements
INSERT INTO achievements (name, description, icon, category, required_value, xp_reward, badge_color) VALUES
('First Steps', 'Complete your first learning mission', '🎯', 'learning', 1, 50, '#10b981'),
('Speed Demon', 'Complete a mission in under 5 minutes', '⚡', 'speed', 1, 100, '#fbbf24'),
('Perfect Score', 'Get 100% on any test', '🏆', 'mastery', 1, 200, '#8b5cf6'),
('Knowledge Seeker', 'Complete 10 missions', '📚', 'learning', 10, 300, '#8b5cf6'),
('Lightning Fast', 'Complete 5 missions in under 3 minutes each', '🌟', 'speed', 5, 500, '#fbbf24'),
('Streak Master', 'Maintain a 7-day learning streak', '🔥', 'streak', 7, 400, '#ec4899'),
('Social Butterfly', 'Share 3 achievements with friends', '🦋', 'social', 3, 150, '#06b6d4'),
('Subject Master', 'Complete all missions in a subject', '👑', 'mastery', 1, 250, '#10b981'),
('Quiz Champion', 'Score 90%+ on 5 quizzes', '🎖️', 'mastery', 5, 350, '#8b5cf6'),
('Memory Master', 'Perfect score on 10 flashcard sessions', '🧠', 'learning', 10, 300, '#10b981'),
('Time Warrior', 'Study for 100 hours total', '⏰', 'streak', 100, 600, '#fbbf24'),
('Exam Ace', 'Score 95%+ on final tests 5 times', '🏅', 'mastery', 5, 750, '#ec4899')
ON CONFLICT (name) DO NOTHING;