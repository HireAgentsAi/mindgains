import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
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
  runOnJS,
} from 'react-native-reanimated';
import { Brain, Sparkles, Zap, Target, BookOpen, Trophy, Crown, Star } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';

const { width, height } = Dimensions.get('window');

// Premium floating particles component
function FloatingParticle({ index, delay }: { index: number; delay: number }) {
  const translateY = useSharedValue(height + 100);
  const translateX = useSharedValue(Math.random() * width);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5 + Math.random() * 0.5);

  useEffect(() => {
    const startAnimation = () => {
      translateY.value = withTiming(-100, { 
        duration: 8000 + Math.random() * 4000,
        easing: Easing.linear 
      });
      opacity.value = withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.6, { duration: 6000 }),
        withTiming(0, { duration: 1000 })
      );
    };

    const timer = setTimeout(startAnimation, delay);
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

  const icons = [Brain, Sparkles, Zap, Target, BookOpen, Trophy, Crown, Star];
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
        size={16 + Math.random() * 8} 
        color={colors[index % colors.length]} 
      />
    </Animated.View>
  );
}

export default function SplashScreen() {
  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(30);
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(40);
  const loadingProgress = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    const initializeApp = async () => {
      startAnimations();
      
      try {
        // Check if Supabase is configured
        if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
          try {
            // Test Supabase connection with timeout
            const user = await Promise.race([
              SupabaseService.getCurrentUser(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
              )
            ]);
            
            if (user) {
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 4000);
              return;
            }
          } catch (supabaseError) {
            console.log('Supabase connection failed, using demo mode:', supabaseError);
            // Continue to auth screen even if Supabase fails
          }
        }
        
        // Navigate to auth screen (works in both demo and real mode)
        setTimeout(() => {
          router.replace('/auth');
        }, 4000);
        
      } catch (error) {
        console.log('Navigation initialization error:', error);
        // Always provide fallback navigation
        setTimeout(() => {
          router.replace('/auth');
        }, 4000);
      }
    };
    
    initializeApp();
  }, []);

  const startAnimations = () => {
    // Enhanced shimmer animation
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );

    // Glow effect
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Logo entrance
    logoOpacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
    logoScale.value = withDelay(500, withSpring(1, { damping: 12, stiffness: 100 }));

    // Title entrance
    titleOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(1200, withSpring(0, { damping: 15, stiffness: 120 }));

    // Tagline entrance
    taglineOpacity.value = withDelay(1800, withTiming(1, { duration: 800 }));
    taglineTranslateY.value = withDelay(1800, withSpring(0, { damping: 15, stiffness: 120 }));

    // Brand statement entrance
    brandOpacity.value = withDelay(2400, withTiming(1, { duration: 800 }));
    brandTranslateY.value = withDelay(2400, withSpring(0, { damping: 15, stiffness: 120 }));

    // Loading progress
    loadingProgress.value = withDelay(3000, withTiming(100, { duration: 1000 }));
  };

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const brandAnimatedStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    width: `${loadingProgress.value}%`,
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-width, width]
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glowIntensity.value * 0.4,
    shadowRadius: 20 + glowIntensity.value * 30,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Premium gradient background */}
      <LinearGradient
        colors={[
          '#0a0a1a',
          '#1a1a2e',
          '#16213e',
          '#0f0f23',
        ]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.background}
      />

      {/* Floating particles */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, index) => (
          <FloatingParticle 
            key={index} 
            index={index} 
            delay={index * 200 + Math.random() * 1000} 
          />
        ))}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Premium logo section */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle, glowAnimatedStyle]}>
          <LinearGradient
            colors={[
              theme.colors.accent.purple,
              theme.colors.accent.blue,
              theme.colors.accent.cyan,
            ]}
            style={styles.logoBackground}
          >
            <Brain size={80} color={theme.colors.text.primary} strokeWidth={2} />
            
            {/* Enhanced shimmer overlay */}
            <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255,255,255,0.3)',
                  'rgba(255,255,255,0.6)',
                  'rgba(255,255,255,0.3)',
                  'transparent'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </LinearGradient>

          {/* Orbital elements */}
          <View style={styles.orbitalContainer}>
            <Animated.View style={[styles.orbitalElement, styles.orbital1]}>
              <LinearGradient
                colors={[theme.colors.accent.yellow, theme.colors.accent.yellow + '80']}
                style={styles.orbitalGlow}
              >
                <Crown size={20} color={theme.colors.text.primary} />
              </LinearGradient>
            </Animated.View>
            
            <Animated.View style={[styles.orbitalElement, styles.orbital2]}>
              <LinearGradient
                colors={[theme.colors.accent.green, theme.colors.accent.green + '80']}
                style={styles.orbitalGlow}
              >
                <Trophy size={18} color={theme.colors.text.primary} />
              </LinearGradient>
            </Animated.View>
            
            <Animated.View style={[styles.orbitalElement, styles.orbital3]}>
              <LinearGradient
                colors={[theme.colors.accent.pink, theme.colors.accent.pink + '80']}
                style={styles.orbitalGlow}
              >
                <Star size={16} color={theme.colors.text.primary} />
              </LinearGradient>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Premium typography */}
        <View style={styles.textContainer}>
          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <Text style={styles.title}>MindGains</Text>
            <LinearGradient
              colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
              style={styles.titleAccent}
            >
              <Text style={styles.titleAccentText}>AI</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.taglineContainer, taglineAnimatedStyle]}>
            <Text style={styles.tagline}>India's Revolutionary</Text>
            <Text style={styles.taglineHighlight}>AI-Powered Learning Platform</Text>
          </Animated.View>

          <Animated.View style={[styles.brandContainer, brandAnimatedStyle]}>
            <View style={styles.brandBadge}>
              <LinearGradient
                colors={[
                  theme.colors.accent.yellow + '30',
                  theme.colors.accent.green + '30'
                ]}
                style={styles.brandBadgeGradient}
              >
                <Crown size={16} color={theme.colors.accent.yellow} />
                <Text style={styles.brandText}>#1 Educational AI in India</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.brandSub}>
              Transforming Exam Preparation for Millions
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Premium loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingFill, loadingAnimatedStyle]} />
          <Animated.View style={[styles.loadingShimmer, shimmerAnimatedStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
              style={styles.shimmerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: theme.spacing.xxl,
    shadowColor: theme.colors.accent.purple,
    shadowOffset: { width: 0, height: 0 },
  },
  logoBackground: {
    width: 160,
    height: 160,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 200,
    height: '100%',
    opacity: 0.8,
  },
  shimmerGradient: {
    flex: 1,
    transform: [{ skewX: '-20deg' }],
  },
  orbitalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  orbitalElement: {
    position: 'absolute',
  },
  orbitalGlow: {
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
    shadowColor: theme.colors.accent.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  orbital1: {
    top: -15,
    right: -15,
  },
  orbital2: {
    bottom: -10,
    left: -20,
  },
  orbital3: {
    top: 25,
    left: -25,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text.primary,
    letterSpacing: 1,
    marginRight: 8,
  },
  titleAccent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  titleAccentText: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text.primary,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  tagline: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  taglineHighlight: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  brandBadge: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  brandBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: theme.colors.accent.yellow,
  },
  brandSub: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
    width: width - theme.spacing.xl * 2,
    alignItems: 'center',
  },
  loadingBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.purple,
    borderRadius: theme.borderRadius.sm,
  },
  loadingShimmer: {
    position: 'absolute',
    top: 0,
    left: -50,
    width: 100,
    height: '100%',
  },
});