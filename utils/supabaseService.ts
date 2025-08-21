import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types
export interface DailyQuiz {
  id: string;
  date: string;
  questions: DailyQuizQuestion[];
  total_points: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  subjects_covered: string[];
  generated_at: string;
  expires_at: string;
  is_active: boolean;
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
  exam_relevance?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  is_bot?: boolean;
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

export interface BattleRoom {
  id: string;
  name: string;
  host_id: string;
  topic_id?: string;
  subject_name?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bet_amount: number;
  max_participants: number;
  current_participants: number;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  questions?: any[];
  room_code?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  winner_id?: string;
  time_limit: number;
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

export interface IndianSubject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  exam_importance?: string;
  total_topics: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectTopic {
  id: string;
  subject_id: string;
  name: string;
  description?: string;
  importance_level: 'high' | 'medium' | 'low';
  exam_frequency: 'frequent' | 'moderate' | 'rare';
  total_questions: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
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

export interface UserCoins {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  last_updated: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  daily_quiz_limit: number;
  ai_generation_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  start_date: string;
  end_date?: string;
  granted_by: 'purchase' | 'referral' | 'trial' | 'admin';
  payment_details?: any;
  created_at: string;
  updated_at: string;
  plan_id?: string;
  daily_quiz_limit: number;
  ai_generation_limit: number;
  auto_renew: boolean;
}

export class SupabaseService {
  static supabase = supabase;

  // Authentication
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Auth session missing is normal for unauthenticated users - don't log as error
        return null;
      }
      
      return user;
    } catch (error) {
      // Silently handle missing auth session - this is expected behavior
      return null;
    }
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  }

  static async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (data.user && !error) {
      // Create profile using edge function
      try {
        await this.callEdgeFunction('create-user-profile', {
          userId: data.user.id,
          email,
          fullName,
        });
      } catch (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    return { user: data.user, error };
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // Profile Management
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // User Stats
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Create default stats if none exist
      if (!data) {
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            total_xp: 0,
            current_level: 1,
            missions_completed: 0,
            streak_days: 0,
            rank: 'Beginner Scholar',
            total_study_time: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        return newStats;
      }

      return data;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Daily Quiz System
  static async ensureTodayQuiz(): Promise<DailyQuiz | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if quiz exists for today
      const { data: existingQuiz, error: checkError } = await supabase
        .from('daily_quizzes')
        .select('*')
        .eq('date', today)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing quiz:', checkError);
      }

      if (existingQuiz) {
        console.log('✅ Found existing daily quiz');
        return existingQuiz;
      }

      // Generate new quiz using edge function
      console.log('🤖 Generating new daily quiz...');
      const result = await this.callEdgeFunction('daily-quiz-generator', {
        force: false,
        date: today,
      });

      if (result.success && result.quiz) {
        console.log('✅ Daily quiz generated successfully');
        return result.quiz;
      } else {
        throw new Error(result.error || 'Failed to generate daily quiz');
      }
    } catch (error) {
      console.error('Error ensuring today quiz:', error);
      return null;
    }
  }

  static async submitDailyQuiz(quizId: string, answers: number[], timeSpent: number) {
    try {
      const result = await this.callEdgeFunction('submit-daily-quiz', {
        daily_quiz_id: quizId,
        answers,
        time_spent: timeSpent,
      });

      return result;
    } catch (error) {
      console.error('Error submitting daily quiz:', error);
      return { success: false, error: error.message };
    }
  }

  // Topic Quiz System
  static async generateTopicQuiz(topicName: string, subjectName: string, difficulty: string, questionCount: number = 15) {
    try {
      const result = await this.callEdgeFunction('topic-quiz-generator', {
        topic_name: topicName,
        subject_name: subjectName,
        difficulty,
        question_count: Math.max(15, questionCount), // Ensure minimum 15 questions
      });

      return result;
    } catch (error) {
      console.error('Error generating topic quiz:', error);
      return { success: false, error: error.message };
    }
  }

  // Content Processing
  static async processImageOCR(imageData: string, imageType: string) {
    try {
      const result = await this.callEdgeFunction('process-image-ocr', {
        imageData,
        imageType,
      });

      return result;
    } catch (error) {
      console.error('Error processing image OCR:', error);
      return { success: false, error: error.message };
    }
  }

  static async processPDF(fileData: string, fileName: string) {
    try {
      const result = await this.callEdgeFunction('process-pdf', {
        fileData,
        fileName,
      });

      return result;
    } catch (error) {
      console.error('Error processing PDF:', error);
      return { success: false, error: error.message };
    }
  }

  static async processYouTube(url: string) {
    try {
      const result = await this.callEdgeFunction('process-youtube', {
        url,
      });

      return result;
    } catch (error) {
      console.error('Error processing YouTube:', error);
      return { success: false, error: error.message };
    }
  }

  // Mission System
  static async createMission(missionData: any) {
    try {
      const result = await this.callEdgeFunction('create-mission', missionData);
      return result;
    } catch (error) {
      console.error('Error creating mission:', error);
      throw error;
    }
  }

  static async getMissionContent(missionId: string, roomType?: string) {
    try {
      const result = await this.callEdgeFunction('get-mission-content', {
        mission_id: missionId,
        room_type: roomType,
      });

      return result;
    } catch (error) {
      console.error('Error getting mission content:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateProgress(progressData: any) {
    try {
      const result = await this.callEdgeFunction('update-progress', progressData);
      return result;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  // Battle System
  static async createBattleRoom(battleData: any) {
    try {
      const result = await this.callEdgeFunction('battle-operations', {
        action: 'create_battle_room',
        ...battleData,
      });

      return result;
    } catch (error) {
      console.error('Error creating battle room:', error);
      return { success: false, error: error.message };
    }
  }

  static async joinBattleRoom(roomCode: string) {
    try {
      const result = await this.callEdgeFunction('battle-operations', {
        action: 'join_battle_room',
        room_code: roomCode,
      });

      return result;
    } catch (error) {
      console.error('Error joining battle room:', error);
      return { success: false, error: error.message };
    }
  }

  static async generateBattleQuestions(topic: string, difficulty: string, questionCount: number = 10) {
    try {
      const result = await this.callEdgeFunction('ai-battle-content', {
        action: 'generate_battle_questions',
        topic,
        difficulty,
        questionCount,
      });

      return result;
    } catch (error) {
      console.error('Error generating battle questions:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserCoins(userId: string): Promise<UserCoins | null> {
    try {
      const { data, error } = await supabase
        .from('user_coins')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Create default coins if none exist
      if (!data) {
        const { data: newCoins, error: createError } = await supabase
          .from('user_coins')
          .insert({
            user_id: userId,
            balance: 1000,
            total_earned: 1000,
            total_spent: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        return newCoins;
      }

      return data;
    } catch (error) {
      console.error('Error getting user coins:', error);
      return null;
    }
  }

  // Subjects and Topics
  static async getIndianSubjects(): Promise<IndianSubject[]> {
    try {
      const { data, error } = await supabase
        .from('indian_subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting Indian subjects:', error);
      return [];
    }
  }

  static async getSubjectTopics(subjectId: string): Promise<SubjectTopic[]> {
    try {
      const { data, error } = await supabase
        .from('subject_topics')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting subject topics:', error);
      return [];
    }
  }

  static async getTopicQuestions(topicId: string): Promise<TopicQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('topic_questions')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting topic questions:', error);
      return [];
    }
  }

  // Achievements
  static async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  // Subscription System
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return [];
    }
  }

  static async checkUserLimits(userId: string) {
    try {
      // Get user subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      // Get today's usage
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      const isPremium = subscription && new Date(subscription.end_date || '1970-01-01') > new Date();
      const dailyLimit = isPremium ? subscription.daily_quiz_limit : 3;
      const dailyQuizzesTaken = usage?.daily_quizzes_taken || 0;

      return {
        isPremium,
        dailyLimit,
        dailyQuizzesTaken,
        remaining: Math.max(0, dailyLimit - dailyQuizzesTaken),
        canTakeQuiz: dailyLimit === -1 || dailyQuizzesTaken < dailyLimit,
        aiGenerationsUsed: usage?.ai_generations_used || 0,
        aiGenerationLimit: isPremium ? subscription.ai_generation_limit : 5,
      };
    } catch (error) {
      console.error('Error checking user limits:', error);
      return {
        isPremium: false,
        dailyLimit: 3,
        dailyQuizzesTaken: 0,
        remaining: 3,
        canTakeQuiz: true,
        aiGenerationsUsed: 0,
        aiGenerationLimit: 5,
      };
    }
  }

  // Leaderboard
  static async getLeaderboard(type: 'global' | 'weekly' | 'friends' | 'local' = 'global') {
    try {
      // For demo, return mock leaderboard data
      const mockLeaderboard = [
        {
          id: '1',
          full_name: 'Priya Sharma',
          total_xp: 15420,
          current_level: 15,
          streak_days: 28,
          rank: 1,
          location: 'Mumbai, Maharashtra',
          status: 'studying',
        },
        {
          id: '2',
          full_name: 'Rahul Kumar',
          total_xp: 14890,
          current_level: 14,
          streak_days: 22,
          rank: 2,
          location: 'Delhi, Delhi',
          status: 'online',
        },
        {
          id: '3',
          full_name: 'Anjali Patel',
          total_xp: 13650,
          current_level: 13,
          streak_days: 19,
          rank: 3,
          location: 'Bangalore, Karnataka',
          status: 'offline',
        },
        {
          id: '4',
          full_name: 'Arjun Singh',
          total_xp: 12340,
          current_level: 12,
          streak_days: 15,
          rank: 4,
          location: 'Pune, Maharashtra',
          status: 'studying',
        },
        {
          id: '5',
          full_name: 'Sneha Reddy',
          total_xp: 11890,
          current_level: 11,
          streak_days: 12,
          rank: 5,
          location: 'Hyderabad, Telangana',
          status: 'online',
        },
      ];

      return mockLeaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Mascot Recommendations
  static async getMascotRecommendations(userId: string): Promise<string[]> {
    try {
      const result = await this.callEdgeFunction('get-mascot-recommendations', {
        userId,
      });

      return result.recommendations || [];
    } catch (error) {
      console.error('Error getting mascot recommendations:', error);
      return [
        "Ready for today's quiz? Let's boost your knowledge! 🚀",
        "Your streak is looking great! Keep it going! 🔥",
        "Try a new subject today to expand your horizons! 📚",
      ];
    }
  }

  // Progress Tracking
  static async getSubjectProgress(userId: string, subjectId: string) {
    try {
      const { data, error } = await supabase
        .from('user_topic_progress')
        .select(`
          *,
          subject_topics (
            name,
            indian_subjects (name)
          )
        `)
        .eq('user_id', userId)
        .eq('subject_topics.subject_id', subjectId);

      if (error) throw error;

      // Calculate aggregate progress
      const topics = data || [];
      const totalTopics = topics.length;
      const attemptedTopics = topics.filter(t => t.questions_attempted > 0).length;
      const averageScore = totalTopics > 0 
        ? Math.round(topics.reduce((sum, t) => sum + t.best_score, 0) / totalTopics)
        : 0;

      return {
        topics_attempted: attemptedTopics,
        total_topics: totalTopics,
        average_score: averageScore,
        proficiency_level: averageScore >= 80 ? 'advanced' : averageScore >= 60 ? 'intermediate' : 'beginner',
      };
    } catch (error) {
      console.error('Error getting subject progress:', error);
      return {
        topics_attempted: 0,
        total_topics: 0,
        average_score: 0,
        proficiency_level: 'beginner',
      };
    }
  }

  static async updateTopicProgress(progressData: any) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

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
          proficiency_level: progressData.score_percentage >= 80 ? 'advanced' : 
                           progressData.score_percentage >= 60 ? 'intermediate' : 'beginner',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,topic_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating topic progress:', error);
      throw error;
    }
  }

  // Admin Functions
  static async getAdminStats() {
    try {
      const [subjects, topics, questions, users] = await Promise.all([
        supabase.from('indian_subjects').select('*', { count: 'exact' }),
        supabase.from('subject_topics').select('*', { count: 'exact' }),
        supabase.from('topic_questions').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' }),
      ]);

      return {
        totalUsers: users.count || 0,
        totalSubjects: subjects.count || 0,
        totalTopics: topics.count || 0,
        totalQuestions: questions.count || 0,
        questionsPerTopic: {},
        lastGenerated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return {
        totalUsers: 0,
        totalSubjects: 0,
        totalTopics: 0,
        totalQuestions: 0,
        questionsPerTopic: {},
        lastGenerated: new Date().toISOString(),
      };
    }
  }

  static async regenerateAllTopicQuestions(progressCallback?: (progress: number, topic: string) => void) {
    try {
      const result = await this.callEdgeFunction('regenerate-topic-questions', {});
      return result;
    } catch (error) {
      console.error('Error regenerating questions:', error);
      throw error;
    }
  }

  static async regenerateSubjectQuestions(subjectName: string) {
    try {
      const result = await this.callEdgeFunction('regenerate-topic-questions', {
        subject_name: subjectName,
      });
      return result;
    } catch (error) {
      console.error('Error regenerating subject questions:', error);
      throw error;
    }
  }

  static async validateDailyQuiz() {
    try {
      const result = await this.callEdgeFunction('validate-daily-quiz', {
        quiz_date: new Date().toISOString().split('T')[0],
      });
      return result;
    } catch (error) {
      console.error('Error validating daily quiz:', error);
      throw error;
    }
  }

  // Utility Functions
  static async trackUserActivity(userId: string, activity: string, metadata?: any) {
    try {
      // Simple activity tracking - in production this would be more comprehensive
      console.log('Activity tracked:', { userId, activity, metadata });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  static async getAppStats() {
    try {
      const [users, missions] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('missions').select('*', { count: 'exact' }),
      ]);

      return {
        totalUsers: users.count || 0,
        activeUsers: Math.floor((users.count || 0) * 0.3), // Estimate 30% active
        totalMissions: missions.count || 0,
      };
    } catch (error) {
      console.error('Error getting app stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalMissions: 0,
      };
    }
  }

  // Edge Function Helper
  static async callEdgeFunction(functionName: string, payload: any) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error calling edge function ${functionName}:`, error);
      throw error;
    }
  }
}

export default SupabaseService;