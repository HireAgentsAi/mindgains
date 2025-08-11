import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { 
  Crown, 
  Star, 
  Zap, 
  Trophy, 
  CircleCheck as CheckCircle, 
  X, 
  ArrowLeft, 
  Sparkles,
  Target,
  Brain,
  Clock,
  Users,
  Shield,
  Infinity
} from 'lucide-react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

const { width = 375 } = Dimensions.get('window') || {};

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  daily_quiz_limit: number;
  ai_generation_limit: number;
  is_active: boolean;
}

// Floating particle component for premium effect
function FloatingParticle({ index }: { index: number }) {
  const translateY = useSharedValue(Math.random() * 800);
  const translateX = useSharedValue(Math.random() * width);
  const opacity = useSharedValue(0.1 + Math.random() * 0.2);
  const scale = useSharedValue(0.5 + Math.random() * 0.5);

  useEffect(() => {
    // Continuous floating animation
    const startAnimation = () => {
      translateY.value = withTiming(
        translateY.value - 100 - Math.random() * 200, 
        { duration: 8000 + Math.random() * 4000, easing: Easing.linear }
      );
      
      opacity.value = withSequence(
        withTiming(0.3, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      );
    };
    
    const timer = setTimeout(startAnimation, index * 200);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const icons = [Crown, Star, Trophy, Zap, Brain, Target];
  const IconComponent = icons[index % icons.length];
  const colors = [
    theme.colors.accent.purple,
    theme.colors.accent.blue,
    theme.colors.accent.cyan,
    theme.colors.accent.yellow,
    theme.colors.accent.green,
    theme.colors.accent.pink,
  ];

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <IconComponent 
        size={12 + Math.random() * 8} 
        color={colors[index % colors.length]} 
      />
    </Animated.View>
  );
}

export default function SubscriptionScreen() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userLimits, setUserLimits] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const plansOpacity = useSharedValue(0);
  const plansTranslateY = useSharedValue(30);
  const shimmerPosition = useSharedValue(-1);
  const crownRotation = useSharedValue(0);

  useEffect(() => {
    loadSubscriptionData();
    
    // Start animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.back()) });
    
    plansOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    plansTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 100 }));
    
    // Continuous animations
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    
    crownRotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const [subscriptionPlans, userLimitsData] = await Promise.all([
        SupabaseService.getSubscriptionPlans(),
        loadUserLimits()
      ]);
      
      setPlans(subscriptionPlans);
      setUserLimits(userLimitsData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserLimits = async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      if (!user) return null;
      
      return await SupabaseService.checkUserLimits(user.id);
    } catch (error) {
      console.error('Error loading user limits:', error);
      return null;
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    
    setIsPurchasing(true);
    
    try {
      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) throw new Error('Plan not found');
      
      // In production, integrate with Razorpay/Stripe
      Alert.alert(
        'Payment Integration',
        `This would integrate with Razorpay for ₹${plan.price_monthly / 100} payment. For demo, we'll simulate successful payment.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Payment',
            onPress: () => {
              Alert.alert(
                'Payment Successful! 🎉',
                'Your Premium subscription is now active. Enjoy unlimited quizzes and AI-powered learning!',
                [{ text: 'Continue', onPress: () => router.back() }]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error processing purchase:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const plansAnimatedStyle = useAnimatedStyle(() => ({
    opacity: plansOpacity.value,
    transform: [{ translateY: plansTranslateY.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-width * 1.5, width * 1.5]
    );
    
    return {
      transform: [
        { translateX },
        { rotate: '-30deg' }
      ],
    };
  });

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownRotation.value}deg` }],
  }));

  if (isLoading) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <MascotAvatar size={80} animated={true} glowing={true} mood="focused" />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
      </LinearGradient>
    );
  }

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toLocaleString('en-IN')}`;
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'users';
      case 'premium monthly': return 'star';
      case 'premium yearly': return 'trophy';
      case 'lifetime': return 'crown';
      default: return 'magic';
    }
  };

  const getPlanColors = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return [theme.colors.accent.blue, theme.colors.accent.cyan];
      case 'premium monthly': return [theme.colors.accent.purple, theme.colors.accent.blue];
      case 'premium yearly': return [theme.colors.accent.green, theme.colors.accent.cyan];
      case 'lifetime': return [theme.colors.accent.yellow, theme.colors.accent.green];
      default: return theme.colors.gradient.primary;
    }
  };

  const isPopularPlan = (planName: string) => {
    return planName.toLowerCase().includes('yearly');
  };

  const isBestValuePlan = (planName: string) => {
    return planName.toLowerCase().includes('lifetime');
  };

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
      
      {/* Background particles */}
      <View style={styles.particlesContainer}>
        {[...Array(15)].map((_, index) => (
          <FloatingParticle key={index} index={index} />
        ))}
      </View>
      
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.backButtonGradient}
          >
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Animated.View style={crownAnimatedStyle}>
            <LinearGradient
              colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
              style={styles.headerIcon}
            >
              <FontAwesome5 name="crown" size={28} color={theme.colors.text.primary} solid />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.headerTitle}>Upgrade to Premium</Text>
          <Text style={styles.headerSubtitle}>Unlock unlimited learning potential</Text>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Usage */}
        {userLimits && (
          <Animated.View style={[styles.usageContainer, plansAnimatedStyle]}>
            <LinearGradient
              colors={[
                theme.colors.background.card,
                theme.colors.background.secondary,
              ]}
              style={styles.usageCard}
            >
              <View style={styles.usageHeader}>
                <Clock size={20} color={theme.colors.accent.blue} />
                <Text style={styles.usageTitle}>Today's Usage</Text>
              </View>
              
              <View style={styles.usageStats}>
                <View style={styles.usageStat}>
                  <Text style={styles.usageStatValue}>
                    {userLimits.dailyQuizzesTaken}/{userLimits.dailyLimit === -1 ? '∞' : userLimits.dailyLimit}
                  </Text>
                  <Text style={styles.usageStatLabel}>Daily Quizzes</Text>
                </View>
                
                <View style={styles.usageProgress}>
                  <View style={styles.usageProgressBar}>
                    <LinearGradient
                      colors={[theme.colors.accent.blue, theme.colors.accent.cyan]}
                      style={[
                        styles.usageProgressFill,
                        { 
                          width: userLimits.dailyLimit === -1 
                            ? '100%' 
                            : `${Math.min((userLimits.dailyQuizzesTaken / userLimits.dailyLimit) * 100, 100)}%` 
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.usageProgressText}>
                    {userLimits.isPremium ? 'Unlimited Access' : `${userLimits.remaining} remaining`}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Subscription Plans */}
        <Animated.View style={[styles.plansContainer, plansAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <Text style={styles.sectionSubtitle}>
            Join over 1 million students who upgraded to Premium
          </Text>
          
          <View style={styles.plansList}>
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                onSelect={() => handlePlanSelect(plan.id)}
                isPopular={isPopularPlan(plan.name)}
                isBestValue={isBestValuePlan(plan.name)}
                icon={getPlanIcon(plan.name)}
                colors={getPlanColors(plan.name)}
                formatPrice={formatPrice}
                index={index}
              />
            ))}
          </View>
        </Animated.View>

        {/* Revenue Model Info */}
        <Animated.View style={[styles.revenueContainer, plansAnimatedStyle]}>
          <LinearGradient
            colors={[theme.colors.accent.green + '20', theme.colors.accent.cyan + '20']}
            style={styles.revenueCard}
          >
            <View style={styles.revenueHeader}>
              <Trophy size={24} color={theme.colors.accent.green} />
              <Text style={styles.revenueTitle}>Proven Revenue Model</Text>
            </View>
            
            <View style={styles.revenueStats}>
              <View style={styles.revenueStat}>
                <FontAwesome5 name="trophy" size={20} color={theme.colors.accent.green} solid />
                <Text style={styles.revenueStatValue}>1M+</Text>
                <Text style={styles.revenueStatLabel}>Monthly Premium</Text>
              </View>
              <View style={styles.revenueStat}>
                <Text style={styles.revenueStatValue}>15.7%</Text>
                <Text style={styles.revenueStatLabel}>Conversion Rate</Text>
              </View>
              <View style={styles.revenueStat}>
                <FontAwesome5 name="infinity" size={14} color={theme.colors.accent.blue} solid />
                <Text style={styles.revenueStatValue}>₹47L</Text>
                <Text style={styles.revenueStatLabel}>Monthly Revenue</Text>
              </View>
            </View>
            
            <Text style={styles.revenueDescription}>
              Based on 1M+ users with proven EdTech conversion rates in India
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Purchase Button */}
        {selectedPlan && (
          <View style={styles.purchaseContainer}>
            <GradientButton
              title={isPurchasing ? "Processing..." : "Upgrade Now"}
              onPress={handlePurchase}
              size="large"
              fullWidth
              disabled={isPurchasing}
              icon={<FontAwesome5 name="crown" size={16} color={theme.colors.text.primary} solid />}
              colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
              style={styles.purchaseButton}
            />
            
            <Text style={styles.purchaseNote}>
              <FontAwesome5 name="shield-alt" size={12} color={theme.colors.accent.green} solid />
              {' '}Secure payment via Razorpay • Cancel anytime • 7-day money-back guarantee
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

function PlanCard({ plan, isSelected, onSelect, isPopular, isBestValue, icon, colors, formatPrice, index }: {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
  isPopular: boolean;
  isBestValue: boolean;
  icon: React.ReactNode;
  colors: string[];
  formatPrice: (price: number) => string;
  index: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 150);
    
    if (isPopular || isBestValue) {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [index, isPopular, isBestValue]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 120 })
    );
    onSelect();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-width, width]
    );
    
    return {
      transform: [
        { translateX },
        { rotate: '-30deg' }
      ],
    };
  });

  const price = plan.price_yearly > 0 ? plan.price_yearly : plan.price_monthly;
  const period = plan.price_yearly > 0 ? 'year' : plan.price_monthly > 0 ? 'month' : '';

  return (
    <Animated.View style={[styles.planCard, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={isSelected ? colors : [theme.colors.background.card, theme.colors.background.secondary]}
          style={[
            styles.planCardGradient,
            isSelected && styles.selectedPlan,
            (isPopular || isBestValue) && styles.featuredPlan
          ]}
        >
          {/* Badges */}
          {isPopular && (
            <View style={styles.popularBadge}>
              <LinearGradient
                colors={[theme.colors.accent.pink, theme.colors.accent.purple]}
                style={styles.popularBadgeGradient}
              >
                <Star size={12} color={theme.colors.text.primary} />
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </LinearGradient>
            </View>
          )}
          
          {isBestValue && (
            <View style={styles.bestValueBadge}>
              <LinearGradient
                colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
                style={styles.bestValueBadgeGradient}
              >
                <Crown size={12} color={theme.colors.text.primary} />
                <Text style={styles.bestValueBadgeText}>BEST VALUE</Text>
              </LinearGradient>
            </View>
          )}

          {/* Plan Header */}
          <View style={styles.planHeader}>
            <View style={[styles.planIcon, { backgroundColor: colors[0] + '30' }]}>
              <FontAwesome5 name={icon} size={28} color={theme.colors.text.primary} solid />
            </View>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
          </View>

          {/* Pricing */}
          <View style={styles.planPricing}>
            {price > 0 ? (
              <>
                <Text style={styles.planPrice}>{formatPrice(price)}</Text>
                <Text style={styles.planPeriod}>/{period}</Text>
                {plan.price_yearly > 0 && (
                  <Text style={styles.planSavings}>
                    Save ₹{((plan.price_monthly * 12 - plan.price_yearly) / 100).toLocaleString('en-IN')}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.planPrice}>Free</Text>
            )}
          </View>

          {/* Features */}
          <View style={styles.planFeatures}>
            {plan.features.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.planFeature}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.planFeatureText}>{feature}</Text>
              </View>
            ))}
            
            {/* Usage Limits */}
            <View style={styles.planFeature}>
              <Infinity size={16} color={theme.colors.accent.blue} />
              <Text style={styles.planFeatureText}>
                {plan.daily_quiz_limit === -1 ? 'Unlimited' : `${plan.daily_quiz_limit}`} daily quizzes
              </Text>
            </View>
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <LinearGradient
                colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                style={styles.selectedIndicatorGradient}
              >
                <CheckCircle size={20} color={theme.colors.text.primary} />
              </LinearGradient>
            </View>
          )}

          {/* Shimmer effect for featured plans */}
          {(isPopular || isBestValue) && (
            <View style={styles.planShimmerContainer}>
              <Animated.View style={[styles.planShimmer, shimmerAnimatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  headerCenter: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  usageContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  usageCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  usageTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  usageStats: {
    gap: theme.spacing.md,
  },
  usageStat: {
    alignItems: 'center',
  },
  usageStatValue: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  usageStatLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  usageProgress: {
    gap: theme.spacing.sm,
  },
  usageProgressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  usageProgressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  usageProgressText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  plansContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  plansList: {
    gap: theme.spacing.lg,
  },
  planCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  planCardGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedPlan: {
    borderColor: theme.colors.accent.purple,
    borderWidth: 2,
    ...theme.shadows.card,
  },
  featuredPlan: {
    borderWidth: 2,
    ...theme.shadows.card,
  },
  popularBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  popularBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  bestValueBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  bestValueBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  bestValueBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  planIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  planName: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  planPricing: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  planPrice: {
    fontSize: 32,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  planPeriod: {
    fontSize: 16,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  planSavings: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.green,
    backgroundColor: theme.colors.accent.green + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  planFeatures: {
    gap: theme.spacing.md,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  planFeatureText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  selectedIndicatorGradient: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planShimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  planShimmer: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: width * 2,
    height: 200,
    opacity: 0.4,
  },
  shimmerGradient: {
    flex: 1,
  },
  revenueContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  revenueCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    justifyContent: 'center',
  },
  revenueTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  revenueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  revenueStat: {
    alignItems: 'center',
  },
  revenueStatValue: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.green,
  },
  revenueStatLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  revenueDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  purchaseContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  purchaseButton: {
    ...theme.shadows.button,
  },
  purchaseNote: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});