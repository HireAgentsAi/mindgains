import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  missions_completed: number;
  streak_days: number;
  last_activity_date: string;
  rank: string;
  total_study_time: number;
  created_at: string;
  updated_at: string;
}

export interface Mission {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject_id?: string;
  content_type: 'youtube' | 'pdf' | 'text' | 'camera';
  content_url?: string;
  content_text?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time: number;
  xp_reward: number;
  status: 'active' | 'archived' | 'draft';
  is_public: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  required_value: number;
  xp_reward: number;
  badge_color: string;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  topic: string;
  subject: string;
  subtopic?: string;
  proficiency_score: number;
  attempts_count: number;
  correct_answers: number;
  total_questions: number;
  last_interacted: string;
  weak_areas: string[];
  strong_areas: string[];
  learning_pattern: Record<string, any>;
  difficulty_preference: string;
  created_at: string;
  updated_at: string;
}

export interface DailyQuiz {
  id: string;
  date: string;
  questions: DailyQuizQuestion[];
  total_points: number;
  difficulty_distribution: Record<string, number>;
  subjects_covered: string[];
  is_active: boolean;
  created_at: string;
}

export interface DailyQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  subject: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface DailyQuizAttempt {
  id: string;
  user_id: string;
  daily_quiz_id: string;
  quiz_date: string;
  answers: any[];
  correct_answers: number;
  total_questions: number;
  score_percentage: number;
  total_points: number;
  time_spent: number;
  completed_at: string;
  created_at: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  topic: string;
  subject: string;
  subtopic?: string;
  proficiency_score: number;
  attempts_count: number;
  correct_answers: number;
  total_questions: number;
  last_interacted: string;
  weak_areas: string[];
  strong_areas: string[];
  learning_pattern: Record<string, any>;
  difficulty_preference: string;
  created_at: string;
  updated_at: string;
}

export interface MascotRecommendation {
  id: string;
  user_id: string;
  recommendation_text: string;
  recommendation_type: string;
  subject?: string;
  priority: number;
  is_shown: boolean;
  shown_at?: string;
  expires_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface IndianSubject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  exam_importance: string;
  total_topics: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectTopic {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  importance_level: 'high' | 'medium' | 'low';
  exam_frequency: 'frequent' | 'moderate' | 'rare';
  total_questions: number;
  difficulty_distribution: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TopicQuestion {
  id: string;
  topic_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  exam_relevance?: string;
  source?: string;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  questions_attempted: number;
  questions_correct: number;
  best_score: number;
  total_time_spent: number;
  last_attempted?: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  weak_areas: string[];
  strong_areas: string[];
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  // Authentication
  static async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    // Create profile using Edge Function
    if (data.user) {
      try {
        const { data: profileData, error: profileError } = await supabase.functions.invoke('create-user-profile', {
          body: {
            userId: data.user.id,
            email,
            fullName
          }
        })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      } catch (profileError) {
        console.error('Profile creation failed:', profileError)
      }
    }

    return data
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    try {
      // Check if Supabase is properly configured
      if (!supabaseUrl || !supabaseAnonKey) {
        console.log('Supabase not configured, using demo mode');
        return null;
      }
      
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error && error.message !== 'Auth session missing!') {
        console.log('Supabase auth error:', error.message);
        return null;
      }
      return user;
    } catch (error) {
      console.log('Supabase connection error:', error);
      return null;
    }
  }

  // Profile Management
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
      throw error
    }

    return data
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User Stats
  static async getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }

    return data
  }

  // Subjects and Topics
  static async getSubjects(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching subjects:', error)
      throw error
    }

    return data || []
  }

  // Daily Quiz
  static async getTodayQuiz(): Promise<DailyQuiz | null> {
    const today = new Date().toISOString().split('T')[0]
    
    console.log('Getting today quiz for date:', today)
    
    const { data, error } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('date', today)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching daily quiz:', error)
      return null
    }

    console.log('Found existing quiz:', data ? 'Yes' : 'No')
    return data
  }

  static async generateDailyQuiz(): Promise<DailyQuiz | null> {
    try {
      console.log('Calling daily-quiz-generator edge function...')
      const { data, error } = await supabase.functions.invoke('daily-quiz-generator')
      
      if (error) {
        console.error('Edge function error:', error)
        throw error
      }
      
      console.log('Daily quiz generation response:', data)
      return data.quiz
    } catch (error) {
      console.error('Error generating daily quiz:', error)
      return null
    }
  }

  static async generateDailyQuizManual(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('daily-quiz-generator', {
        body: { 
          force: true,
          admin_trigger: true 
        }
      });

      if (error) {
        console.error('Error generating daily quiz:', error);
        return { success: false, message: error.message || 'Failed to generate daily quiz' };
      }

      return { success: true, message: 'Daily quiz generated successfully!' };
    } catch (error) {
      console.error('Error in generateDailyQuizManual:', error);
      return { success: false, message: 'Failed to generate daily quiz' };
    }
  }

  static async ensureTodayQuiz(): Promise<DailyQuiz | null> {
    try {
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        console.log('Using demo quiz - Supabase not configured')
        // Return demo quiz for development
        return {
          id: 'demo-daily-quiz',
          date: new Date().toISOString().split('T')[0],
          questions: [
            {
              id: 'dq1',
              question: 'Which Article of the Indian Constitution guarantees Right to Equality?',
              options: ['Article 12', 'Article 14', 'Article 16', 'Article 19'],
              correct_answer: 1,
              explanation: 'Article 14 guarantees equality before law and equal protection of laws to all persons within the territory of India.',
              subject: 'Polity',
              subtopic: 'Fundamental Rights',
              difficulty: 'medium',
              points: 10,
            },
            {
              id: 'dq2',
              question: 'Who was the first Governor-General of independent India?',
              options: ['Lord Mountbatten', 'C. Rajagopalachari', 'Warren Hastings', 'Lord Curzon'],
              correct_answer: 0,
              explanation: 'Lord Mountbatten was the first Governor-General of independent India from August 1947 to June 1948.',
              subject: 'History',
              subtopic: 'Modern India',
              difficulty: 'easy',
              points: 5,
            },
            {
              id: 'dq3',
              question: 'Which river is known as the "Sorrow of Bengal"?',
              options: ['Ganga', 'Brahmaputra', 'Damodar', 'Hooghly'],
              correct_answer: 2,
              explanation: 'The Damodar River was known as the "Sorrow of Bengal" due to its frequent floods before the construction of dams.',
              subject: 'Geography',
              subtopic: 'Physical Geography',
              difficulty: 'medium',
              points: 10,
            },
            {
              id: 'dq4',
              question: 'What is the full form of NITI Aayog?',
              options: ['National Institution for Transforming India', 'National Institute for Technology Integration', 'National Investment and Trade Initiative', 'National Industrial Training Institute'],
              correct_answer: 0,
              explanation: 'NITI Aayog stands for National Institution for Transforming India, established in 2015 to replace the Planning Commission.',
              subject: 'Economy',
              subtopic: 'Economic Policy',
              difficulty: 'medium',
              points: 10,
            },
            {
              id: 'dq5',
              question: 'Which Indian space mission successfully reached Mars?',
              options: ['Chandrayaan-1', 'Mangalyaan', 'Gaganyaan', 'Aditya-L1'],
              correct_answer: 1,
              explanation: 'Mangalyaan (Mars Orbiter Mission) was India\'s first successful Mars mission, launched by ISRO in 2013.',
              subject: 'Science & Technology',
              subtopic: 'Space Program',
              difficulty: 'easy',
              points: 5,
            },
            {
              id: 'dq6',
              question: 'Who wrote the Indian National Anthem "Jana Gana Mana"?',
              options: ['Bankim Chandra Chattopadhyay', 'Rabindranath Tagore', 'Sarojini Naidu', 'Subhas Chandra Bose'],
              correct_answer: 1,
              explanation: 'Rabindranath Tagore wrote "Jana Gana Mana" which was adopted as India\'s National Anthem in 1950.',
              subject: 'History',
              subtopic: 'Cultural Heritage',
              difficulty: 'easy',
              points: 5,
            },
            {
              id: 'dq7',
              question: 'Which constitutional amendment is known as the "Mini Constitution"?',
              options: ['42nd Amendment', '44th Amendment', '73rd Amendment', '74th Amendment'],
              correct_answer: 0,
              explanation: 'The 42nd Amendment (1976) is called the "Mini Constitution" due to the extensive changes it made to the Constitution.',
              subject: 'Polity',
              subtopic: 'Constitutional Amendments',
              difficulty: 'hard',
              points: 15,
            },
            {
              id: 'dq8',
              question: 'Which plateau is known as the "Deccan Trap"?',
              options: ['Malwa Plateau', 'Deccan Plateau', 'Chota Nagpur Plateau', 'Meghalaya Plateau'],
              correct_answer: 1,
              explanation: 'The Deccan Plateau is known as the "Deccan Trap" due to its volcanic origin and step-like structure.',
              subject: 'Geography',
              subtopic: 'Physical Features',
              difficulty: 'medium',
              points: 10,
            },
            {
              id: 'dq9',
              question: 'What is the current repo rate set by RBI (as of 2024)?',
              options: ['6.50%', '6.25%', '6.75%', '7.00%'],
              correct_answer: 0,
              explanation: 'The Reserve Bank of India has maintained the repo rate at 6.50% to balance growth and inflation concerns.',
              subject: 'Economy',
              subtopic: 'Monetary Policy',
              difficulty: 'medium',
              points: 10,
            },
            {
              id: 'dq10',
              question: 'Which Indian city hosted the G20 Summit in 2023?',
              options: ['Mumbai', 'New Delhi', 'Bangalore', 'Hyderabad'],
              correct_answer: 1,
              explanation: 'New Delhi hosted the G20 Summit in September 2023 under India\'s G20 Presidency with the theme "Vasudhaiva Kutumbakam".',
              subject: 'Current Affairs',
              subtopic: 'International Relations',
              difficulty: 'easy',
              points: 5,
            },
          ],
          total_points: 95,
          difficulty_distribution: { easy: 4, medium: 5, hard: 1 },
          subjects_covered: ['History', 'Polity', 'Geography', 'Economy', 'Science & Technology', 'Current Affairs'],
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }
      
      // First try to get existing quiz
      console.log('Checking for existing daily quiz...')
      let quiz = await this.getTodayQuiz()
      
      if (!quiz) {
        console.log('No existing quiz found, generating new one...')
        // Generate new quiz using edge function
        quiz = await this.generateDailyQuiz()
      }
      
      console.log('Final quiz result:', quiz ? 'Success' : 'Failed')
      return quiz
    } catch (error) {
      console.error('Error ensuring today quiz:', error)
      return null
    }
  }

  static async submitDailyQuiz(dailyQuizId: string, answers: number[], timeSpent: number) {
    try {
      const { data, error } = await supabase.functions.invoke('submit-daily-quiz', {
        body: {
          daily_quiz_id: dailyQuizId,
          answers,
          time_spent: timeSpent
        }
      })
      
      if (error) throw error
      return { success: true, ...data }
    } catch (error) {
      console.error('Error submitting daily quiz:', error)
      return { success: false, error: error.message }
    }
  }

  static async getDailyQuizAttempt(userId: string, date?: string): Promise<DailyQuizAttempt | null> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_date', targetDate)
      .maybeSingle()

    if (error) {
      console.error('Error fetching daily quiz attempt:', error)
      return null
    }

    return data
  }

  // Subject Quizzes
  static async getSubjectQuiz(subject: string, subtopic?: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase.functions.invoke('generate-subject-quiz', {
      body: { subject, subtopic }
    })

    if (error) throw error
    return data.questions || []
  }

  // User Memory & Personalization
  static async getUserMemory(userId: string): Promise<UserMemory[]> {
    const { data, error } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .order('proficiency_score', { ascending: true })

    if (error) {
      console.error('Error fetching user memory:', error)
      throw error
    }

    return data || []
  }

  static async updateUserMemory(
    userId: string, 
    topic: string, 
    subject: string, 
    proficiencyData: {
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      weakAreas?: string[];
      strongAreas?: string[];
      difficulty?: string;
    }
  ) {
    const { score, correctAnswers, totalQuestions, weakAreas = [], strongAreas = [], difficulty = 'medium' } = proficiencyData
    
    const { data, error } = await supabase
      .from('user_memory')
      .upsert({
        user_id: userId,
        topic,
        subject,
        subtopic: topic !== subject ? topic : undefined,
        proficiency_score: score,
        attempts_count: 1,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        weak_areas: weakAreas,
        strong_areas: strongAreas,
        difficulty_preference: difficulty,
        last_interacted: new Date().toISOString(),
        learning_pattern: {
          last_score: score,
          performance_trend: score >= 70 ? 'improving' : 'needs_focus',
          last_attempt_date: new Date().toISOString().split('T')[0]
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,topic,subject'
      })

    if (error) throw error
    return data
  }

  // Mascot Recommendations
  static async getMascotRecommendations(userId: string): Promise<string[]> {
    try {
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        return ["Ready to boost your knowledge today? 🚀"];
      }
      
      // Get active recommendations from database first
      const { data: dbRecommendations, error: dbError } = await supabase
        .from('mascot_recommendations')
        .select('recommendation_text')
        .eq('user_id', userId)
        .eq('is_shown', false)
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: true })
        .limit(3)

      if (dbRecommendations && dbRecommendations.length > 0) {
        // Mark as shown
        await supabase
          .from('mascot_recommendations')
          .update({ 
            is_shown: true, 
            shown_at: new Date().toISOString() 
          })
          .eq('user_id', userId)
          .eq('is_shown', false)

        return dbRecommendations.map(r => r.recommendation_text)
      }

      // Generate new recommendations if none exist
      const { data, error } = await supabase.functions.invoke('get-mascot-recommendations', {
        body: { userId }
      })

      if (error) throw error
      return data.recommendations || ["Ready to boost your knowledge today? 🚀"]
    } catch (error) {
      console.error('Error getting mascot recommendations:', error)
      return ["Ready to boost your knowledge today? 🚀"]
    }
  }

  static async getPersonalizedStudyPlan(userId: string) {
    try {
      // Get user memory to identify weak areas
      const userMemory = await this.getUserMemory(userId)
      const weakAreas = userMemory
        .filter(m => m.proficiency_score < 60)
        .sort((a, b) => a.proficiency_score - b.proficiency_score)
        .slice(0, 3)

      return {
        weakAreas: weakAreas.map(area => ({
          subject: area.subject,
          topic: area.topic,
          proficiency: area.proficiency_score,
          recommendation: `Focus on ${area.topic} - Current proficiency: ${area.proficiency_score}%`
        })),
        nextSteps: [
          "Take today's daily quiz to track progress",
          "Create focused missions on weak topics",
          "Review flashcards for better retention"
        ]
      }
    } catch (error) {
      console.error('Error getting study plan:', error)
      return { weakAreas: [], nextSteps: [] }
    }
  }

  // Progress Tracking
  static async updateQuizProgress(userId: string, quizData: {
    quiz_type: 'daily' | 'subject';
    subject?: string;
    subtopic?: string;
    score: number;
    total_questions: number;
    time_spent: number;
  }) {
    const { data, error } = await supabase.functions.invoke('update-quiz-progress', {
      body: { userId, ...quizData }
    })

    if (error) throw error
    return data
  }

  // Enhanced Mission Content with AI
  static async getMissionContent(missionId: string, roomType: string) {
    try {
      const { data, error } = await supabase.functions.invoke('get-mission-content', {
        body: { mission_id: missionId, room_type: roomType }
      })
      
      if (error) throw error
      return { success: true, ...data }
    } catch (error) {
      console.error('Error getting mission content:', error)
      return { success: false, error: error.message }
    }
  }

  static async updateProgress(progressData: {
    mission_id: string;
    room_type: string;
    score: number;
    max_score: number;
    time_spent: number;
    completed: boolean;
  }) {
    try {
      const { data, error } = await supabase.functions.invoke('update-progress', {
        body: progressData
      })
      
      if (error) throw error
      return { success: true, ...data }
    } catch (error) {
      console.error('Error updating progress:', error)
      return { success: false, error: error.message }
    }
  }

  // Enhanced Mission Creation with AI
  static async createMission(missionData: {
    title: string;
    description?: string;
    content_type: 'youtube' | 'pdf' | 'text' | 'camera';
    content_url?: string;
    content_text?: string;
    subject_name?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    contentType?: string;
    examFocus?: string;
  }) {
    try {
      const { data, error } = await supabase.functions.invoke('create-mission', {
        body: missionData
      })
      
      if (error) throw error
      return { success: true, ...data }
    } catch (error) {
      console.error('Error creating mission:', error)
      return { success: false, error: error.message, message: error.message }
    }
  }

  // Achievements
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements:achievement_id (
          name,
          description,
          icon,
          badge_color
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching achievements:', error)
      throw error
    }

    return data || []
  }

  static async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) {
      console.error('Error fetching achievements:', error)
      throw error
    }

    return data || []
  }

  // Leaderboard
  static async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly') {
    try {
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          *,
          profiles!user_stats_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .order('total_xp', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching leaderboard:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getLeaderboard:', error)
      return []
    }
  }

  // Analytics for marketing
  static async trackUserActivity(userId: string, activity: string, metadata?: any) {
    try {
      // Update last activity date
      await supabase
        .from('user_stats')
        .update({ 
          last_activity_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      // Log activity for analytics
      console.log(`User ${userId} performed: ${activity}`, metadata)
    } catch (error) {
      console.error('Error tracking activity:', error)
    }
  }

  // App Stats for marketing
  static async getAppStats() {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get active users (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: activeUsers } = await supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity_date', sevenDaysAgo.toISOString().split('T')[0])

      // Get total quizzes taken
      const { count: totalQuizzes } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalQuizzes: totalQuizzes || 0,
      }
    } catch (error) {
      console.error('Error fetching app stats:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalQuizzes: 0,
      }
    }
  }

  // Indian Subjects System
  static async getIndianSubjects(): Promise<IndianSubject[]> {
    try {
      const { data, error } = await supabase
        .from('indian_subjects')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching Indian subjects:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getIndianSubjects:', error)
      return []
    }
  }

  // Indian Subjects System - Enhanced Methods
  static async getSubjectProgress(userId: string, subjectId: string) {
    try {
      const { data, error } = await supabase
        .from('user_topic_progress')
        .select(`
          *,
          subject_topics!inner(subject_id)
        `)
        .eq('user_id', userId)
        .eq('subject_topics.subject_id', subjectId)

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          topics_attempted: 0,
          average_score: 0,
          total_time_spent: 0,
          proficiency_level: 'beginner'
        }
      }

      const totalScore = data.reduce((sum, p) => sum + p.best_score, 0)
      const totalTime = data.reduce((sum, p) => sum + p.total_time_spent, 0)
      const averageScore = Math.round(totalScore / data.length)
      
      let proficiencyLevel = 'beginner'
      if (averageScore >= 90) proficiencyLevel = 'expert'
      else if (averageScore >= 75) proficiencyLevel = 'advanced'
      else if (averageScore >= 60) proficiencyLevel = 'intermediate'

      return {
        topics_attempted: data.length,
        average_score: averageScore,
        total_time_spent: Math.round(totalTime / 60), // Convert to hours
        proficiency_level: proficiencyLevel
      }
    } catch (error) {
      console.error('Error getting subject progress:', error)
      return {
        topics_attempted: 0,
        average_score: 0,
        total_time_spent: 0,
        proficiency_level: 'beginner'
      }
    }
  }

  static async getLearningStats(userId: string): Promise<LearningStats> {
    try {
      const [userStats, topicProgress, subjects] = await Promise.all([
        this.getUserStats(userId),
        supabase
          .from('user_topic_progress')
          .select('*')
          .eq('user_id', userId),
        this.getIndianSubjects()
      ])

      const completedTopics = topicProgress.data?.filter(p => p.best_score >= 70).length || 0
      const totalScore = topicProgress.data?.reduce((sum, p) => sum + p.best_score, 0) || 0
      const averageScore = topicProgress.data?.length ? Math.round(totalScore / topicProgress.data.length) : 0
      const totalTimeSpent = topicProgress.data?.reduce((sum, p) => sum + p.total_time_spent, 0) || 0

      return {
        totalSubjects: subjects.length,
        completedTopics,
        averageScore,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to hours
        currentStreak: userStats?.streak_days || 0,
        weeklyGoal: 10 // Default weekly goal
      }
    } catch (error) {
      console.error('Error getting learning stats:', error)
      return {
        totalSubjects: 6,
        completedTopics: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        weeklyGoal: 10
      }
    }
  }

  static async getSubjectTopics(subjectId: string): Promise<SubjectTopic[]> {
    try {
      const { data, error } = await supabase
        .from('subject_topics')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('importance_level', { ascending: false })

      if (error) {
        console.error('Error fetching subject topics:', error)
        throw error
      }

      // Get user progress for each topic if user is authenticated
      try {
        const user = await this.getCurrentUser()
        if (user) {
          const topicIds = data?.map(t => t.id) || []
          const { data: progressData } = await supabase
            .from('user_topic_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('topic_id', topicIds)

          // Merge progress data with topics
          return (data || []).map(topic => ({
            ...topic,
            user_progress: progressData?.find(p => p.topic_id === topic.id)
          }))
        }
      } catch (progressError) {
        console.error('Error fetching user progress:', progressError)
      }

      return data || []
    } catch (error) {
      console.error('Error in getSubjectTopics:', error)
      return []
    }
  }

  static async getTopicQuestions(topicId: string): Promise<TopicQuestion[]> {
    try {
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        console.log('Using demo topic questions - Supabase not configured')
        return [];
      }
      
      const { data, error } = await supabase
        .from('topic_questions')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .order('created_at')

      if (error) {
        console.error('Error fetching topic questions:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getTopicQuestions:', error)
      return []
    }
  }

  // Generate questions for all topics using AI
  static async generateAllTopicQuestions(progressCallback?: (progress: number, topic: string) => void) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-topic-questions', {
        body: { force_regenerate: false }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error generating topic questions:', error)
      throw error
    }
  }

  // Validate daily quiz using traditional + AI methods
  static async validateDailyQuiz(quizDate?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('validate-daily-quiz', {
        body: { quiz_date: quizDate }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error validating daily quiz:', error)
      throw error
    }
  }

  static async updateTopicProgress(progressData: {
    topic_id: string;
    questions_attempted: number;
    questions_correct: number;
    score_percentage: number;
    total_points: number;
    time_spent: number;
    detailed_results: any[];
  }) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Calculate proficiency level
      const proficiencyLevel = this.calculateProficiencyLevel(progressData.score_percentage)
      
      // Analyze weak and strong areas
      const weakAreas = progressData.detailed_results
        .filter(r => !r.is_correct)
        .map(r => r.difficulty)
        .filter(Boolean)
      
      const strongAreas = progressData.detailed_results
        .filter(r => r.is_correct)
        .map(r => r.difficulty)
        .filter(Boolean)

      // Update or insert progress
      const { data, error } = await supabase
        .from('user_topic_progress')
        .upsert({
          user_id: user.id,
          topic_id: progressData.topic_id,
          questions_attempted: progressData.questions_attempted,
          questions_correct: progressData.questions_correct,
          best_score: progressData.score_percentage,
          total_time_spent: progressData.time_spent,
          last_attempted: new Date().toISOString(),
          proficiency_level: proficiencyLevel,
          weak_areas: [...new Set(weakAreas)],
          strong_areas: [...new Set(strongAreas)],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,topic_id'
        })

      if (error) throw error

      // Update user memory for personalized recommendations
      await this.updateUserMemoryFromTopicQuiz(user.id, progressData)

      return data
    } catch (error) {
      console.error('Error updating topic progress:', error)
      throw error
    }
  }

  private static calculateProficiencyLevel(scorePercentage: number): string {
    if (scorePercentage >= 90) return 'expert'
    if (scorePercentage >= 75) return 'advanced'
    if (scorePercentage >= 60) return 'intermediate'
    return 'beginner'
  }

  private static async updateUserMemoryFromTopicQuiz(userId: string, progressData: any) {
    try {
      // Get topic and subject info
      const { data: topicInfo } = await supabase
        .from('subject_topics')
        .select('name, indian_subjects(name)')
        .eq('id', progressData.topic_id)
        .single()

      if (!topicInfo) return

      const topicName = topicInfo.name
      const subjectName = topicInfo.indian_subjects.name

      // Update user memory
      await this.updateUserMemory(userId, topicName, subjectName, {
        score: progressData.score_percentage,
        correctAnswers: progressData.questions_correct,
        totalQuestions: progressData.questions_attempted,
        weakAreas: progressData.detailed_results
          .filter((r: any) => !r.is_correct)
          .map((r: any) => r.difficulty),
        strongAreas: progressData.detailed_results
          .filter((r: any) => r.is_correct)
          .map((r: any) => r.difficulty)
      })
    } catch (error) {
      console.error('Error updating user memory from topic quiz:', error)
    }
  }

  // Generate topic quiz on-demand with AI
  static async generateTopicQuiz(topicName: string, subjectName: string, difficulty: string = 'mixed', questionCount: number = 15) {
    try {
      // Ensure minimum 15 questions
      const finalQuestionCount = Math.max(15, questionCount);
      
      console.log('Generating topic quiz:', { topicName, subjectName, difficulty, questionCount })
      
      const { data, error } = await supabase.functions.invoke('generate-topic-quiz', {
        body: {
          topic_name: topicName,
          subject_name: subjectName,
          difficulty,
          question_count: finalQuestionCount
        }
      })
      
      if (error) {
        console.error('Topic quiz generation error:', error)
        throw error
      }
      
      console.log('Topic quiz generation response:', data)
      return { success: true, ...data }
    } catch (error) {
      console.error('Error generating topic quiz:', error)
      return { success: false, error: error.message }
    }
  }

  // Check user subscription and usage limits
  static async checkUserLimits(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const [subscription, usage] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('*, subscription_plans(*)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('usage_tracking')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle()
      ])

      const dailyQuizzesTaken = usage.data?.daily_quizzes_taken || 0
      const isPremium = subscription.data?.subscription_plans?.daily_quiz_limit === -1
      const dailyLimit = isPremium ? -1 : 3
      
      return {
        isPremium,
        dailyQuizzesTaken,
        dailyLimit,
        canTakeQuiz: isPremium || dailyQuizzesTaken < 3,
        remaining: isPremium ? -1 : Math.max(0, 3 - dailyQuizzesTaken)
      }
    } catch (error) {
      console.error('Error checking user limits:', error)
      return {
        isPremium: false,
        dailyQuizzesTaken: 0,
        dailyLimit: 3,
        canTakeQuiz: true,
        remaining: 3
      }
    }
  }

  // Get subscription plans
  static async getSubscriptionPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      return []
    }
  }

  // Admin Functions
  static async getAdminStats() {
    try {
      const [usersCount, questionsCount, subjectsCount, topicsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('topic_questions').select('*', { count: 'exact', head: true }),
        supabase.from('indian_subjects').select('*', { count: 'exact', head: true }),
        supabase.from('subject_topics').select('*', { count: 'exact', head: true })
      ])

      // Get questions per topic breakdown
      const { data: questionBreakdown } = await supabase
        .from('topic_questions')
        .select('topic_id, subject_topics(name, indian_subjects(name))')

      const questionsPerTopic: Record<string, number> = {}
      questionBreakdown?.forEach(q => {
        const subjectName = q.subject_topics?.indian_subjects?.name
        if (subjectName) {
          questionsPerTopic[subjectName] = (questionsPerTopic[subjectName] || 0) + 1
        }
      })

      return {
        totalUsers: usersCount.count || 0,
        totalQuestions: questionsCount.count || 0,
        totalSubjects: subjectsCount.count || 0,
        totalTopics: topicsCount.count || 0,
        questionsPerTopic,
        lastGenerated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      throw error
    }
  }

  static async regenerateAllTopicQuestions(progressCallback?: (progress: number, topic: string) => void) {
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-topic-questions', {
        body: {} // Regenerate all
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error regenerating all questions:', error)
      throw error
    }
  }

  static async regenerateSubjectQuestions(subjectName: string) {
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-topic-questions', {
        body: { subject_name: subjectName }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error regenerating subject questions:', error)
      throw error
    }
  }
}