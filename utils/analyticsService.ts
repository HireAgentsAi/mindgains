import { SupabaseService } from './supabaseService';

export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export class AnalyticsService {
  // Track user engagement events
  static async trackEvent(eventName: string, properties?: Record<string, any>) {
    try {
      const user = await SupabaseService.getCurrentUser();
      
      const event: AnalyticsEvent = {
        event_name: eventName,
        user_id: user?.id,
        properties: {
          ...properties,
          platform: 'mobile',
          app_version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      // Log for development (in production, send to analytics service)
      console.log('Analytics Event:', event);
      
      // Track in Supabase for user activity
      if (user) {
        await SupabaseService.trackUserActivity(user.id, eventName, properties);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Marketing-specific events
  static async trackAppOpen() {
    await this.trackEvent('app_opened');
  }

  static async trackSignUp(method: string) {
    await this.trackEvent('user_signed_up', { method });
  }

  static async trackMissionCreated(contentType: string, subject?: string) {
    await this.trackEvent('mission_created', { content_type: contentType, subject });
  }

  static async trackRoomCompleted(roomType: string, score: number, timeSpent: number) {
    await this.trackEvent('room_completed', { 
      room_type: roomType, 
      score, 
      time_spent: timeSpent 
    });
  }

  static async trackAchievementUnlocked(achievementId: string, achievementTitle: string) {
    await this.trackEvent('achievement_unlocked', { 
      achievement_id: achievementId,
      achievement_title: achievementTitle 
    });
  }

  static async trackShare(contentType: string, platform?: string) {
    await this.trackEvent('content_shared', { content_type: contentType, platform });
  }

  static async trackRetention(daysActive: number) {
    await this.trackEvent('user_retention', { days_active: daysActive });
  }

  // Conversion tracking for marketing
  static async trackConversion(conversionType: string, value?: number) {
    await this.trackEvent('conversion', { 
      conversion_type: conversionType, 
      value 
    });
  }

  // Feature usage tracking
  static async trackFeatureUsage(feature: string, duration?: number) {
    await this.trackEvent('feature_used', { 
      feature_name: feature, 
      duration 
    });
  }
}