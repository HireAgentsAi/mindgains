import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Brain, Sparkles, Trophy, Users, Star, Target, Zap, Crown, BookOpen, TrendingUp, Download, Share2, Play, CircleCheck as CheckCircle, ArrowRight, Globe, Smartphone } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { MarketingService, type MarketingMetrics } from '@/utils/marketingService';
import { AnalyticsService } from '@/utils/analyticsService';
import { demoMarketingData } from '@/utils/demoData';

const { width, height } = Dimensions.get('window');

export default function MarketingScreen() {
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.9);
  const statsOpacity = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);
  const testimonialsOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);
  const floatingY = useSharedValue(0);

  useEffect(() => {
    loadMarketingData();
    startAnimations();
  }, []);

  const loadMarketingData = async () => {
    try {
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        // Use demo marketing data
        const demoMetrics: MarketingMetrics = {
          totalUsers: 156789,
          activeUsers: 12456,
          totalMissions: 89234,
          averageSessionTime: 18.5,
          retentionRate: 84.2,
          conversionRate: 15.7,
          topSubjects: [
            { name: 'UPSC', count: 45678 },
            { name: 'JEE/NEET', count: 34567 },
            { name: 'Banking', count: 28901 },
            { name: 'SSC', count: 23456 },
          ],
          userGrowth: demoMarketingData.userGrowth.map(item => ({
            date: item.month,
            count: item.users,
          })),
        };
        
        setMetrics(demoMetrics);
        setIsLoading(false);
        return;
      }
      
      const marketingMetrics = await MarketingService.getMarketingMetrics();
      setMetrics(marketingMetrics);
      
      // Track marketing page view
      await AnalyticsService.trackEvent('marketing_page_view');
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startAnimations = () => {
    // Hero section
    heroOpacity.value = withTiming(1, { duration: 800 });
    heroScale.value = withSpring(1, { damping: 15, stiffness: 100 });

    // Staggered content animations
    statsOpacity.value = withTiming(1, { duration: 600, delay: 200 });
    featuresOpacity.value = withTiming(1, { duration: 600, delay: 400 });
    testimonialsOpacity.value = withTiming(1, { duration: 600, delay: 600 });
    ctaOpacity.value = withTiming(1, { duration: 600, delay: 800 });

    // Continuous animations
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    floatingY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  };

  const handleDownload = async () => {
    await AnalyticsService.trackEvent('download_button_clicked');
    
    // In production, this would open app store links
    Linking.openURL('https://mindgains.ai/download');
  };

  const handleShare = async () => {
    await AnalyticsService.trackShare('marketing_page');
    
    // Share app
    const shareText = `🚀 Check out MindGains AI - India's #1 AI-powered learning platform!

Transform any content into interactive learning missions for competitive exams.

Download now: https://mindgains.ai

#MindGainsAI #CompetitiveExams #AILearning`;

    try {
      await Share.share({
        message: shareText,
        title: 'MindGains AI - AI-Powered Learning',
        url: 'https://mindgains.ai',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
  }));

  const testimonialsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: testimonialsOpacity.value,
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const floatingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-width * 1.5, width * 1.5]
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  const marketingCopy = MarketingService.getMarketingCopy();

  return (
    <LinearGradient
      colors={[
        theme.colors.background.primary,
        theme.colors.background.secondary,
        theme.colors.background.tertiary,
      ]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, heroAnimatedStyle]}>
          <Animated.View style={floatingAnimatedStyle}>
            <MascotAvatar
              size={120}
              animated={true}
              glowing={true}
              mood="celebrating"
            />
          </Animated.View>
          
          <Text style={styles.heroTitle}>MindGains AI</Text>
          <Text style={styles.heroTagline}>{marketingCopy.taglines[0]}</Text>
          
          <LinearGradient
            colors={[theme.colors.accent.yellow + '30', theme.colors.accent.green + '30']}
            style={styles.heroCard}
          >
            <Text style={styles.heroDescription}>
              Transform any YouTube video, PDF, or text into interactive learning missions 
              optimized for UPSC, JEE, NEET, Banking, and other competitive exams.
            </Text>
            
            <View style={styles.heroFeatures}>
              {marketingCopy.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={styles.heroFeature}>
                  <CheckCircle size={16} color={theme.colors.accent.green} />
                  <Text style={styles.heroFeatureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Social Proof Stats */}
        <Animated.View style={[styles.statsSection, statsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Trusted by Students Across India</Text>
          
          <View style={styles.socialProofGrid}>
            <SocialProofCard
              value={marketingCopy.socialProof.userCount}
              label="Active Students"
              icon={<Users size={24} color={theme.colors.text.primary} />}
              color={theme.colors.accent.purple}
            />
            <SocialProofCard
              value={marketingCopy.socialProof.examsCovered}
              label="Exams Covered"
              icon={<BookOpen size={24} color={theme.colors.text.primary} />}
              color={theme.colors.accent.blue}
            />
            <SocialProofCard
              value={marketingCopy.socialProof.successRate}
              label="Success Rate"
              icon={<Trophy size={24} color={theme.colors.text.primary} />}
              color={theme.colors.accent.green}
            />
            <SocialProofCard
              value={marketingCopy.socialProof.averageImprovement}
              label="Score Improvement"
              icon={<TrendingUp size={24} color={theme.colors.text.primary} />}
              color={theme.colors.accent.yellow}
            />
          </View>
        </Animated.View>

        {/* Features Showcase */}
        <Animated.View style={[styles.featuresSection, featuresAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Why Choose MindGains AI?</Text>
          
          <View style={styles.featuresGrid}>
            {[
              {
                icon: <Brain size={32} color={theme.colors.text.primary} />,
                title: "AI-Powered Content",
                description: "Transform any content into structured learning missions",
                color: theme.colors.accent.purple,
              },
              {
                icon: <Target size={32} color={theme.colors.text.primary} />,
                title: "Exam-Focused",
                description: "Tailored for UPSC, JEE, NEET, Banking & more",
                color: theme.colors.accent.blue,
              },
              {
                icon: <Zap size={32} color={theme.colors.text.primary} />,
                title: "4-Room Learning",
                description: "Clarity → Quiz → Memory → Test progression",
                color: theme.colors.accent.yellow,
              },
              {
                icon: <Trophy size={32} color={theme.colors.text.primary} />,
                title: "Gamified Experience",
                description: "XP, levels, achievements & streaks",
                color: theme.colors.accent.green,
              },
            ].map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </View>
        </Animated.View>

        {/* Testimonials */}
        <Animated.View style={[styles.testimonialsSection, testimonialsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Success Stories</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.testimonialsScroll}
          >
            {marketingCopy.testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} index={index} />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Call to Action */}
        <Animated.View style={[styles.ctaSection, ctaAnimatedStyle]}>
          <LinearGradient
            colors={[theme.colors.accent.purple + '30', theme.colors.accent.blue + '30']}
            style={styles.ctaCard}
          >
            <Crown size={48} color={theme.colors.accent.yellow} />
            <Text style={styles.ctaTitle}>Ready to Transform Your Exam Prep?</Text>
            <Text style={styles.ctaDescription}>
              Join over 1 million students who are already using AI to ace their competitive exams.
            </Text>
            
            <View style={styles.ctaButtons}>
              <GradientButton
                title="Download Now"
                onPress={handleDownload}
                size="large"
                icon={<Download size={20} color={theme.colors.text.primary} />}
                colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                style={styles.ctaButton}
              />
              
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <LinearGradient
                  colors={[theme.colors.background.card, theme.colors.background.secondary]}
                  style={styles.shareButtonGradient}
                >
                  <Share2 size={20} color={theme.colors.accent.purple} />
                  <Text style={styles.shareButtonText}>Share App</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

function SocialProofCard({ value, label, icon, color }: {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.socialProofCard, animatedStyle]}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.socialProofGradient}
      >
        <View style={[styles.socialProofIcon, { backgroundColor: color + '30' }]}>
          {icon}
        </View>
        <Text style={styles.socialProofValue}>{value}</Text>
        <Text style={styles.socialProofLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function FeatureCard({ feature, index }: {
  feature: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
  };
  index: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 150);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.featureCard, animatedStyle]}>
      <LinearGradient
        colors={[feature.color + '20', feature.color + '10']}
        style={styles.featureGradient}
      >
        <View style={[styles.featureIcon, { backgroundColor: feature.color + '30' }]}>
          {feature.icon}
        </View>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function TestimonialCard({ testimonial, index }: {
  testimonial: {
    text: string;
    author: string;
    rating: number;
  };
  index: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 200);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.testimonialCard, animatedStyle]}>
      <LinearGradient
        colors={[theme.colors.background.card, theme.colors.background.secondary]}
        style={styles.testimonialGradient}
      >
        <View style={styles.testimonialRating}>
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} size={16} color={theme.colors.accent.yellow} fill={theme.colors.accent.yellow} />
          ))}
        </View>
        
        <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
        <Text style={styles.testimonialAuthor}>- {testimonial.author}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  heroTagline: {
    fontSize: 18,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  heroCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    width: '100%',
  },
  heroDescription: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  heroFeatures: {
    gap: theme.spacing.md,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  heroFeatureText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
  },
  statsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  socialProofGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  socialProofCard: {
    width: '47%',
  },
  socialProofGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  socialProofIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  socialProofValue: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  socialProofLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  featureCard: {
    width: '47%',
  },
  featureGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    minHeight: 180,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  testimonialsSection: {
    marginBottom: theme.spacing.xl,
  },
  testimonialsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  testimonialCard: {
    width: 280,
  },
  testimonialGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  testimonialRating: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  testimonialText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  ctaSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  ctaCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  ctaTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  ctaDescription: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  ctaButtons: {
    width: '100%',
    gap: theme.spacing.md,
  },
  ctaButton: {
    marginBottom: theme.spacing.sm,
  },
  shareButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  bottomSpacing: {
    height: 20,
  },
});