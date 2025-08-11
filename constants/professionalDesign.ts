// Professional Design System for MindGains AI
// Inspired by Duolingo's clean, minimal approach

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 100,
} as const;

export const colors = {
  // Primary brand colors
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  // Supporting colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral colors
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    card: '#ffffff',
    elevated: '#ffffff',
  },
  
  // Text colors
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    quaternary: '#cbd5e1',
    inverse: '#ffffff',
  },
  
  // Border colors
  border: {
    light: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.12)',
    dark: 'rgba(0, 0, 0, 0.18)',
  },
} as const;

export const typography = {
  // Headers
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  
  // Small text
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  smallMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Component-specific styles
export const components = {
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 0,
  },
  
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      height: 44,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      ...shadows.sm,
    },
    secondary: {
      backgroundColor: colors.gray100,
      borderRadius: borderRadius.md,
      height: 44,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      height: 44,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  },
  
  listItem: {
    backgroundColor: colors.background.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
    ...shadows.sm,
  },
  
  avatar: {
    sm: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    md: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    lg: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    xl: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
  },
  
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minHeight: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.white,
  },
} as const;

// Animation configurations
export const animations = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
  },
} as const;

// Layout constants
export const layout = {
  headerHeight: 56,
  tabBarHeight: 64,
  listItemHeight: 64,
  buttonHeight: 44,
  inputHeight: 44,
  
  // Screen padding
  screenPadding: spacing.md,
  sectionSpacing: spacing.lg,
  
  // Touch targets
  minTouchTarget: 44,
} as const;

export default {
  spacing,
  borderRadius,
  colors,
  typography,
  shadows,
  components,
  animations,
  layout,
};