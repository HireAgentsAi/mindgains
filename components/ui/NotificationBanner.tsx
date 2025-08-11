import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { X, Trophy, Star, Zap, Crown } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface NotificationBannerProps {
  visible: boolean;
  onClose: () => void;
  type: 'achievement' | 'level_up' | 'streak' | 'milestone';
  title: string;
  message: string;
  icon?: React.ReactNode;
  autoHide?: boolean;
  duration?: number;
}

export default function NotificationBanner({
  visible,
  onClose,
  type,
  title,
  message,
  icon,
  autoHide = true,
  duration = 4000
}: NotificationBannerProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });

      if (autoHide) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoHide, duration]);

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-100, { duration: 300, easing: Easing.in(Easing.back()) });
    
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const getTypeColors = () => {
    switch (type) {
      case 'achievement':
        return [theme.colors.accent.yellow, theme.colors.accent.green];
      case 'level_up':
        return [theme.colors.accent.purple, theme.colors.accent.blue];
      case 'streak':
        return [theme.colors.accent.pink, theme.colors.accent.purple];
      case 'milestone':
        return [theme.colors.accent.cyan, theme.colors.accent.blue];
      default:
        return theme.colors.gradient.primary;
    }
  };

  const getTypeIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'achievement':
        return <Trophy size={24} color={theme.colors.text.primary} />;
      case 'level_up':
        return <Crown size={24} color={theme.colors.text.primary} />;
      case 'streak':
        return <Zap size={24} color={theme.colors.text.primary} />;
      case 'milestone':
        return <Star size={24} color={theme.colors.text.primary} />;
      default:
        return <Trophy size={24} color={theme.colors.text.primary} />;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={getTypeColors()}
        style={styles.banner}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {getTypeIcon()}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1000,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  banner: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    opacity: 0.9,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
});