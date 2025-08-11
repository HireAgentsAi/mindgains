import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { User } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface ProfessionalAvatarProps {
  size?: number;
  imageUrl?: string;
  initials?: string;
  animated?: boolean;
  backgroundColor?: string;
}

export default function ProfessionalAvatar({
  size = 48,
  imageUrl,
  initials,
  animated = false,
  backgroundColor = theme.colors.accent.purple,
}: ProfessionalAvatarProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      // Subtle professional animation - just a gentle pulse
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

  const renderContent = () => {
    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.avatarImage, { width: size - 4, height: size - 4 }]}
          resizeMode="cover"
        />
      );
    }
    
    if (initials) {
      return (
        <View style={styles.initialsContainer}>
          <Text style={[styles.initialsText, { fontSize: size * 0.4 }]}>
            {initials.substring(0, 2).toUpperCase()}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.placeholderContainer}>
        <User
          size={size * 0.5}
          color={theme.colors.text.primary}
        />
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor,
        },
        animatedStyle,
      ]}
    >
      {renderContent()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    ...theme.shadows.sm,
  },
  avatarImage: {
    borderRadius: 999,
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});