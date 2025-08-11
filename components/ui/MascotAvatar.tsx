import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';

interface MascotAvatarProps {
  size?: number;
  animated?: boolean;
  glowing?: boolean;
  mood?: 'happy' | 'excited' | 'focused' | 'celebrating';
}

export default function MascotAvatar({
  size = 48,
  animated = false,
  glowing = false,
  mood = 'happy',
}: MascotAvatarProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      // Mood-based animations
      switch (mood) {
        case 'celebrating':
          scale.value = withRepeat(
            withSequence(
              withTiming(1.1, { duration: 500 }),
              withTiming(1, { duration: 500 })
            ),
            -1,
            true
          );
          rotation.value = withRepeat(
            withSequence(
              withTiming(5, { duration: 1000 }),
              withTiming(-5, { duration: 1000 })
            ),
            -1,
            true
          );
          break;
        case 'excited':
          scale.value = withRepeat(
            withSequence(
              withTiming(1.08, { duration: 800 }),
              withTiming(1, { duration: 800 })
            ),
            -1,
            true
          );
          break;
        case 'focused':
          scale.value = withRepeat(
            withSequence(
              withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
              withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
          );
          break;
        default:
          scale.value = withRepeat(
            withSequence(
              withTiming(1.02, { duration: 1500 }),
              withTiming(1, { duration: 1500 })
            ),
            -1,
            true
          );
      }
    }
    
    if (glowing) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [animated, glowing, mood]);

  const getMascotIcon = () => {
    switch (mood) {
      case 'celebrating': return 'laugh-beam';
      case 'excited': return 'grin-stars';
      case 'focused': return 'glasses';
      default: return 'smile';
    }
  };

  const getMascotColors = () => {
    switch (mood) {
      case 'celebrating': return [theme.colors.accent.yellow, theme.colors.accent.green];
      case 'excited': return [theme.colors.accent.pink, theme.colors.accent.purple];
      case 'focused': return [theme.colors.accent.blue, theme.colors.accent.cyan];
      default: return [theme.colors.accent.purple, theme.colors.accent.blue];
    }
  };
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));


  return (
    <Animated.View
      style={[
      { rotate: `${rotation.value}deg` },
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor,
        },
      ]}
    >
      {renderContent()}
    </Animated.View>
      <LinearGradient
        colors={getMascotColors()}
        style={styles.mascotGradient}
      >
        <FontAwesome5 
          name={getMascotIcon()} 
          size={size * 0.5} 
          color={theme.colors.text.primary} 
          solid 
        />
      </LinearGradient>
    shadowOpacity: glowing ? 0.3 + glow.value * 0.4 : 0.15,
    shadowRadius: glowing ? 15 + glow.value * 10 : 8,
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: theme.colors.accent.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  mascotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});