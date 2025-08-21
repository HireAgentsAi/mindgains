import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Confetti explosion for correct answers
export function ConfettiExplosion({ visible, onComplete }: {
  visible: boolean;
  onComplete?: () => void;
}) {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    translateX: useSharedValue(width / 2),
    translateY: useSharedValue(height / 2),
    rotation: useSharedValue(0),
    opacity: useSharedValue(0),
    scale: useSharedValue(0),
  }));

  useEffect(() => {
    if (visible) {
      particles.forEach((particle, index) => {
        const delay = index * 50;
        const angle = (index / particles.length) * 2 * Math.PI;
        const distance = 100 + Math.random() * 200;
        
        particle.opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
        particle.scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
        
        particle.translateX.value = withDelay(
          delay,
          withTiming(
            width / 2 + Math.cos(angle) * distance,
            { duration: 1500, easing: Easing.out(Easing.quad) }
          )
        );
        
        particle.translateY.value = withDelay(
          delay,
          withSequence(
            withTiming(
              height / 2 + Math.sin(angle) * distance,
              { duration: 800, easing: Easing.out(Easing.quad) }
            ),
            withTiming(
              height + 100,
              { duration: 700, easing: Easing.in(Easing.quad) }
            )
          )
        );
        
        particle.rotation.value = withDelay(
          delay,
          withTiming(360 * (2 + Math.random()), { duration: 1500 })
        );
        
        particle.opacity.value = withDelay(
          delay + 1000,
          withTiming(0, { duration: 500 }, () => {
            if (index === particles.length - 1 && onComplete) {
              runOnJS(onComplete)();
            }
          })
        );
      });
    }
  }, [visible]);

  const colors = [
    theme.colors.accent.yellow,
    theme.colors.accent.green,
    theme.colors.accent.blue,
    theme.colors.accent.pink,
    theme.colors.accent.purple,
    theme.colors.accent.cyan,
  ];

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {particles.map((particle, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: particle.translateX.value },
            { translateY: particle.translateY.value },
            { rotate: `${particle.rotation.value}deg` },
            { scale: particle.scale.value },
          ],
          opacity: particle.opacity.value,
        }));

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: colors[index % colors.length],
              },
              animatedStyle,
            ]}
          />
        );
      })}
    </View>
  );
}

// Liquid progress bar animation
export function LiquidProgressBar({ progress, color = theme.colors.accent.blue }: {
  progress: number;
  color?: string;
}) {
  const progressValue = useSharedValue(0);
  const waveOffset = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withSpring(progress, { damping: 15, stiffness: 100 });
    
    waveOffset.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const waveStyle = useAnimatedStyle(() => {
    const translateX = interpolate(waveOffset.value, [0, 1], [-50, 0]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.liquidProgressContainer}>
      <View style={styles.liquidProgressBar}>
        <Animated.View style={[styles.liquidProgressFill, progressStyle]}>
          <LinearGradient
            colors={[color, color + '80']}
            style={styles.liquidGradient}
          >
            <Animated.View style={[styles.liquidWave, waveStyle]}>
              <LinearGradient
                colors={['transparent', color + '40', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.waveGradient}
              />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

// XP collection animation
export function XPCollectionAnimation({ visible, amount, onComplete }: {
  visible: boolean;
  amount: number;
  onComplete?: () => void;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      
      translateY.value = withSequence(
        withTiming(-50, { duration: 800, easing: Easing.out(Easing.quad) }),
        withTiming(-100, { duration: 500, easing: Easing.in(Easing.quad) })
      );
      
      opacity.value = withDelay(
        800,
        withTiming(0, { duration: 500 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.xpAnimation, animatedStyle]}>
      <LinearGradient
        colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
        style={styles.xpBadge}
      >
        <Text style={styles.xpText}>+{amount} XP</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// Streak fire animation
export function StreakFireAnimation({ streakDays, animated = true }: {
  streakDays: number;
  animated?: boolean;
}) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (animated && streakDays > 0) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );

      rotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 2000 }),
          withTiming(-5, { duration: 2000 })
        ),
        -1,
        true
      );

      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [animated, streakDays]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    shadowOpacity: 0.3 + glow.value * 0.4,
    shadowRadius: 10 + glow.value * 15,
  }));

  const getStreakColor = () => {
    if (streakDays >= 30) return [theme.colors.accent.pink, theme.colors.accent.purple];
    if (streakDays >= 14) return [theme.colors.accent.yellow, theme.colors.accent.green];
    if (streakDays >= 7) return [theme.colors.accent.green, theme.colors.accent.cyan];
    return [theme.colors.accent.blue, theme.colors.accent.purple];
  };

  return (
    <Animated.View style={[styles.streakContainer, animatedStyle]}>
      <LinearGradient
        colors={getStreakColor()}
        style={styles.streakBadge}
      >
        <Text style={styles.streakIcon}>🔥</Text>
        <Text style={styles.streakText}>{streakDays}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// Achievement unlock animation
export function AchievementUnlockAnimation({ visible, achievement, onComplete }: {
  visible: boolean;
  achievement?: {
    name: string;
    icon: string;
    rarity: string;
  };
  onComplete?: () => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievement) {
      // Entrance animation
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 100 })
      );

      // Celebration rotation
      rotation.value = withSequence(
        withTiming(360, { duration: 1000 }),
        withTiming(720, { duration: 1000 })
      );

      // Glow effect
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        4,
        true
      );

      // Auto-hide after 3 seconds
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, 3000);
    }
  }, [visible, achievement]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
    shadowOpacity: 0.3 + glowIntensity.value * 0.5,
    shadowRadius: 20 + glowIntensity.value * 30,
  }));

  if (!visible || !achievement) return null;

  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return [theme.colors.accent.gold, theme.colors.accent.yellow];
      case 'epic': return [theme.colors.accent.purple, theme.colors.accent.pink];
      case 'rare': return [theme.colors.accent.blue, theme.colors.accent.cyan];
      default: return [theme.colors.accent.green, theme.colors.accent.cyan];
    }
  };

  return (
    <View style={styles.achievementOverlay}>
      <Animated.View style={[styles.achievementContainer, animatedStyle]}>
        <LinearGradient
          colors={getRarityColors(achievement.rarity)}
          style={styles.achievementBadge}
        >
          <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          <Text style={styles.achievementName}>{achievement.name}</Text>
          <Text style={styles.achievementRarity}>{achievement.rarity.toUpperCase()}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// Mascot reaction animation
export function MascotReaction({ reaction, visible }: {
  reaction: 'correct' | 'incorrect' | 'perfect' | 'encouraging';
  visible: boolean;
}) {
  const scale = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      
      switch (reaction) {
        case 'correct':
          scale.value = withSequence(
            withSpring(1.3, { damping: 10, stiffness: 100 }),
            withSpring(1, { damping: 15, stiffness: 100 })
          );
          bounceY.value = withSequence(
            withTiming(-20, { duration: 300 }),
            withSpring(0, { damping: 12, stiffness: 100 })
          );
          break;
          
        case 'incorrect':
          scale.value = withSequence(
            withTiming(0.9, { duration: 100 }),
            withTiming(1.1, { duration: 100 }),
            withTiming(1, { duration: 100 })
          );
          break;
          
        case 'perfect':
          scale.value = withRepeat(
            withSequence(
              withTiming(1.2, { duration: 300 }),
              withTiming(1, { duration: 300 })
            ),
            3,
            true
          );
          break;
          
        case 'encouraging':
          bounceY.value = withRepeat(
            withSequence(
              withTiming(-10, { duration: 500 }),
              withTiming(0, { duration: 500 })
            ),
            2,
            true
          );
          break;
      }

      // Auto-hide after animation
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
      }, 2000);
    }
  }, [visible, reaction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: bounceY.value },
    ],
    opacity: opacity.value,
  }));

  const getReactionEmoji = () => {
    switch (reaction) {
      case 'correct': return '🎉';
      case 'incorrect': return '🤔';
      case 'perfect': return '🌟';
      case 'encouraging': return '💪';
      default: return '😊';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.mascotReaction, animatedStyle]}>
      <Text style={styles.reactionEmoji}>{getReactionEmoji()}</Text>
    </Animated.View>
  );
}

// Screen shake for wrong answers
export function ScreenShake({ trigger }: { trigger: boolean }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none" />;
}

// Coin collection animation
export function CoinCollectionAnimation({ visible, amount, onComplete }: {
  visible: boolean;
  amount: number;
  onComplete?: () => void;
}) {
  const coins = Array.from({ length: Math.min(amount / 10, 10) }, (_, i) => ({
    id: i,
    translateX: useSharedValue(Math.random() * width),
    translateY: useSharedValue(height),
    rotation: useSharedValue(0),
    opacity: useSharedValue(1),
    scale: useSharedValue(1),
  }));

  useEffect(() => {
    if (visible) {
      coins.forEach((coin, index) => {
        const delay = index * 100;
        
        coin.translateY.value = withDelay(
          delay,
          withSequence(
            withTiming(height / 2, { duration: 800, easing: Easing.out(Easing.quad) }),
            withTiming(100, { duration: 600, easing: Easing.in(Easing.quad) })
          )
        );
        
        coin.rotation.value = withDelay(
          delay,
          withTiming(720, { duration: 1400 })
        );
        
        coin.opacity.value = withDelay(
          delay + 1000,
          withTiming(0, { duration: 400 }, () => {
            if (index === coins.length - 1 && onComplete) {
              runOnJS(onComplete)();
            }
          })
        );
      });
    }
  }, [visible]);

  return (
    <View style={styles.coinContainer} pointerEvents="none">
      {coins.map((coin) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: coin.translateX.value },
            { translateY: coin.translateY.value },
            { rotate: `${coin.rotation.value}deg` },
            { scale: coin.scale.value },
          ],
          opacity: coin.opacity.value,
        }));

        return (
          <Animated.View key={coin.id} style={[styles.coin, animatedStyle]}>
            <LinearGradient
              colors={[theme.colors.accent.yellow, theme.colors.accent.gold]}
              style={styles.coinGradient}
            >
              <Text style={styles.coinText}>💎</Text>
            </LinearGradient>
          </Animated.View>
        );
      })}
    </View>
  );
}

// Level up celebration
export function LevelUpCelebration({ visible, newLevel, onComplete }: {
  visible: boolean;
  newLevel: number;
  onComplete?: () => void;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const raysRotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.5, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 100 })
      );

      rotation.value = withSequence(
        withTiming(360, { duration: 1000 }),
        withTiming(720, { duration: 1000 })
      );

      raysRotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );

      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, 3000);
    }
  }, [visible]);

  const levelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const raysAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${raysRotation.value}deg` }],
    opacity: opacity.value * 0.6,
  }));

  if (!visible) return null;

  return (
    <View style={styles.levelUpOverlay}>
      <Animated.View style={[styles.levelUpRays, raysAnimatedStyle]}>
        <LinearGradient
          colors={[theme.colors.accent.yellow + '40', 'transparent']}
          style={styles.ray}
        />
        <LinearGradient
          colors={[theme.colors.accent.yellow + '40', 'transparent']}
          style={[styles.ray, { transform: [{ rotate: '45deg' }] }]}
        />
        <LinearGradient
          colors={[theme.colors.accent.yellow + '40', 'transparent']}
          style={[styles.ray, { transform: [{ rotate: '90deg' }] }]}
        />
        <LinearGradient
          colors={[theme.colors.accent.yellow + '40', 'transparent']}
          style={[styles.ray, { transform: [{ rotate: '135deg' }] }]}
        />
      </Animated.View>
      
      <Animated.View style={[styles.levelUpBadge, levelAnimatedStyle]}>
        <LinearGradient
          colors={[theme.colors.accent.gold, theme.colors.accent.yellow]}
          style={styles.levelUpGradient}
        >
          <Text style={styles.levelUpIcon}>👑</Text>
          <Text style={styles.levelUpText}>LEVEL UP!</Text>
          <Text style={styles.levelUpNumber}>Level {newLevel}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Confetti styles
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Liquid progress styles
  liquidProgressContainer: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.tertiary,
  },
  liquidProgressBar: {
    flex: 1,
    position: 'relative',
  },
  liquidProgressFill: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  liquidGradient: {
    flex: 1,
    position: 'relative',
  },
  liquidWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  waveGradient: {
    flex: 1,
  },

  // XP animation styles
  xpAnimation: {
    position: 'absolute',
    top: height / 2,
    left: width / 2 - 40,
    zIndex: 1000,
  },
  xpBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  xpText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  // Streak fire styles
  streakContainer: {
    shadowColor: theme.colors.accent.yellow,
    shadowOffset: { width: 0, height: 0 },
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },

  // Achievement unlock styles
  achievementOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
  },
  achievementContainer: {
    shadowColor: theme.colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
  },
  achievementBadge: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  achievementName: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  achievementRarity: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    opacity: 0.8,
  },

  // Mascot reaction styles
  mascotReaction: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 100,
  },
  reactionEmoji: {
    fontSize: 32,
  },

  // Level up styles
  levelUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1000,
  },
  levelUpRays: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  ray: {
    position: 'absolute',
    width: 4,
    height: 100,
    left: 98,
    top: 0,
  },
  levelUpBadge: {
    shadowColor: theme.colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
  },
  levelUpGradient: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  levelUpIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  levelUpText: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  levelUpNumber: {
    fontSize: 32,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },

  // Coin collection styles
  coinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  coin: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  coinGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    fontSize: 12,
  },
});

export default {
  ConfettiExplosion,
  LiquidProgressBar,
  XPCollectionAnimation,
  StreakFireAnimation,
  AchievementUnlockAnimation,
  MascotReaction,
  ScreenShake,
  CoinCollectionAnimation,
  LevelUpCelebration,
};