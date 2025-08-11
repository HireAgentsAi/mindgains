import { SupabaseService } from './supabaseService';
import { AnalyticsService } from './analyticsService';
import { demoAppStats } from './demoData';

export interface MarketingMetrics {
  totalUsers: number;
  activeUsers: number;
  totalMissions: number;
  averageSessionTime: number;
  retentionRate: number;
  conversionRate: number;
  topSubjects: Array<{ name: string; count: number }>;
  userGrowth: Array<{ date: string; count: number }>;
}

export class MarketingService {
  // Get comprehensive marketing metrics
  static async getMarketingMetrics(): Promise<MarketingMetrics> {
    try {
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        return {
          totalUsers: demoAppStats.totalUsers,
          activeUsers: demoAppStats.activeUsers,
          totalMissions: demoAppStats.totalMissions,
          averageSessionTime: 18.5,
          retentionRate: 84.2,
          conversionRate: 15.7,
          topSubjects: [
            { name: 'UPSC', count: 45678 },
            { name: 'JEE/NEET', count: 34567 },
            { name: 'Banking', count: 28901 },
            { name: 'SSC', count: 23456 },
          ],
          userGrowth: this.generateGrowthData(),
        };
      }
      
      const appStats = await SupabaseService.getAppStats();
      
      // Calculate additional metrics (these would be real queries in production)
      const metrics: MarketingMetrics = {
        totalUsers: appStats.totalUsers,
        activeUsers: appStats.activeUsers,
        totalMissions: appStats.totalMissions,
        averageSessionTime: 15.5, // minutes - would be calculated from real data
        retentionRate: 78.5, // percentage - would be calculated from real data
        conversionRate: 12.3, // percentage - would be calculated from real data
        topSubjects: [
          { name: 'UPSC', count: 45 },
          { name: 'JEE/NEET', count: 32 },
          { name: 'Banking', count: 28 },
          { name: 'SSC', count: 21 },
        ],
        userGrowth: this.generateGrowthData(),
      };

      return metrics;
    } catch (error) {
      console.error('Error fetching marketing metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  private static generateGrowthData() {
    const data = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 10 + (29 - i) * 2, // Simulated growth
      });
    }
    
    return data;
  }

  private static getDefaultMetrics(): MarketingMetrics {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalMissions: 0,
      averageSessionTime: 0,
      retentionRate: 0,
      conversionRate: 0,
      topSubjects: [],
      userGrowth: [],
    };
  }

  // Generate marketing copy
  static getMarketingCopy() {
    return {
      taglines: [
        "India's #1 AI-Powered Learning Platform",
        "Transform Any Content Into Interactive Learning",
        "Master Competitive Exams with AI",
        "Revolutionizing Exam Preparation in India",
      ],
      features: [
        "🤖 AI-Generated Quizzes & Flashcards",
        "🎯 Exam-Focused Content Creation",
        "📊 Real-Time Progress Tracking",
        "🏆 Gamified Learning Experience",
        "📱 Works on All Devices",
        "🔄 Adaptive Learning Paths",
      ],
      testimonials: [
        {
          text: "MindGains AI helped me crack UPSC Prelims! The AI-generated content is spot-on.",
          author: "Priya Sharma, UPSC Aspirant",
          rating: 5,
        },
        {
          text: "Best app for JEE preparation. The 4-room system is genius!",
          author: "Rahul Kumar, JEE Topper",
          rating: 5,
        },
        {
          text: "Banking exam prep became so much easier with MindGains AI.",
          author: "Anjali Patel, SBI PO",
          rating: 5,
        },
      ],
      socialProof: {
        userCount: "1M+",
        examsCovered: "50+",
        successRate: "94%",
        averageImprovement: "67%",
      },
    };
  }

  // Track marketing campaigns
  static async trackCampaign(campaignId: string, source: string, medium: string) {
    await AnalyticsService.trackEvent('campaign_click', {
      campaign_id: campaignId,
      source,
      medium,
    });
  }

  // Track app store metrics
  static async trackAppStoreView(store: 'google_play' | 'app_store') {
    await AnalyticsService.trackEvent('app_store_view', { store });
  }

  static async trackAppDownload(source: string) {
    await AnalyticsService.trackEvent('app_download', { source });
  }

  // Referral tracking
  static async trackReferral(referrerUserId: string, newUserId: string) {
    await AnalyticsService.trackEvent('user_referred', {
      referrer_user_id: referrerUserId,
      new_user_id: newUserId,
    });
  }

  // A/B testing support
  static async trackExperiment(experimentName: string, variant: string, outcome?: string) {
    await AnalyticsService.trackEvent('experiment_view', {
      experiment_name: experimentName,
      variant,
      outcome,
    });
  }
}