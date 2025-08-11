import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface AndroidTabBarProps {
  children: React.ReactNode;
}

export default function AndroidTabBar({ children }: AndroidTabBarProps) {
  const elevation = useSharedValue(0);
  
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      elevation.value = withSpring(16, { damping: 15, stiffness: 100 });
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    elevation: elevation.value,
    shadowOpacity: elevation.value / 24,
  }));

  if (Platform.OS !== 'android') {
    return <>{children}</>;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={[
          'rgba(15, 15, 35, 0.98)',
          'rgba(15, 15, 35, 1)',
        ]}
        style={styles.gradient}
      >
        {/* Material Design ripple effect background */}
        <View style={styles.materialBackground} />
        
        {/* Top accent line */}
        <LinearGradient
          colors={[theme.colors.accent.purple, theme.colors.accent.blue, theme.colors.accent.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
        
        {children}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 16,
  },
  gradient: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  materialBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    borderRadius: 1,
  },
});