import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface ProfessionalLoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: any;
}

export default function ProfessionalLoading({
  size = 'medium',
  color = theme.colors.accent.purple,
  style,
}: ProfessionalLoadingProps) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 36;
      default:
        return 24;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={animatedStyle}>
        <ActivityIndicator size={getSize()} color={color} />
      </Animated.View>
    </View>
  );
}

// Skeleton loading for lists
export function ProfessionalSkeleton({ 
  width = '100%', 
  height = 16, 
  style 
}: { 
  width?: number | string;
  height?: number;
  style?: any;
}) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeleton: {
    backgroundColor: theme.colors.border.primary,
    borderRadius: theme.borderRadius.sm,
  },
});