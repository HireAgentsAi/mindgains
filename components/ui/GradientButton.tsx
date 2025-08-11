import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function GradientButton({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  size = 'medium',
  fullWidth = false,
  icon,
  variant = 'primary',
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    
    // Clean press animation
    scale.value = withSequence(
      withTiming(0.97, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    opacity.value = withSequence(
      withTiming(0.8, { duration: 50 }),
      withTiming(1, { duration: 150 })
    );
    
    onPress(event);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 36,
          paddingHorizontal: theme.spacing.md,
          fontSize: 14,
        };
      case 'large':
        return {
          height: 52,
          paddingHorizontal: theme.spacing.xl,
          fontSize: 16,
        };
      default:
        return {
          height: 44,
          paddingHorizontal: theme.spacing.lg,
          fontSize: 16,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.background.secondary,
          borderWidth: 1,
          borderColor: theme.colors.border.primary,
          textColor: theme.colors.text.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: theme.colors.accent.purple,
        };
      default:
        return {
          backgroundColor: theme.colors.accent.purple,
          textColor: theme.colors.text.primary,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { width: fullWidth ? '100%' : undefined },
        animatedStyle,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            height: sizeStyles.height,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            backgroundColor: disabled 
              ? theme.colors.text.quaternary 
              : variantStyles.backgroundColor,
            borderWidth: variantStyles.borderWidth || 0,
            borderColor: variantStyles.borderColor,
          },
          variant === 'primary' && theme.shadows.sm,
        ]}
      >
        {icon && <>{icon}</>}
        <Text
          style={[
            styles.text,
            {
              fontSize: sizeStyles.fontSize,
              color: disabled 
                ? theme.colors.text.tertiary 
                : variantStyles.textColor,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});