// MindGains AI - Billion Dollar UI Design System
// World-class, unique, professional Android design

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 100,
} as const;

// Unique color palette inspired by neural networks and knowledge
export const colors = {
  // Primary brand - sophisticated purple-blue
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Unique accent colors for gamification
  success: {
    50: '#ecfdf5',
    500: '#10b981',
    600: '#059669',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  // Unique neural network inspired colors
  neural: {
    cyan: '#06b6d4',
    emerald: '#10b981',
    violet: '#8b5cf6',
    rose: '#f43f5e',
    amber: '#f59e0b',
  },
  
  // Sophisticated grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Background system
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    glass: 'rgba(255, 255, 255, 0.85)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text system
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    quaternary: '#94a3b8',
    inverse: '#ffffff',
    muted: '#cbd5e1',
  },
  
  // Border system
  border: {
    light: 'rgba(0, 0, 0, 0.04)',
    medium: 'rgba(0, 0, 0, 0.08)',
    strong: 'rgba(0, 0, 0, 0.12)',
    accent: 'rgba(99, 102, 241, 0.2)',
  },
} as const;

// Typography system
export const typography = {
  // Display text - for hero sections
  display: {
    lg: {
      fontSize: 36,
      fontWeight: '800' as const,
      lineHeight: 44,
      letterSpacing: -0.5,
    },
    md: {
      fontSize: 30,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: -0.25,
    },
    sm: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
  },
  
  // Headlines
  h1: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
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
    lg: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 26,
    },
    md: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    sm: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
  },
  
  // Labels and captions
  label: {
    lg: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 22,
    },
    md: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    sm: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
  },
  
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
} as const;

// Unique shadow system
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  // Unique colored shadows for special elements
  brand: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Component definitions
export const components = {
  // Cards with unique styles
  card: {
    default: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...shadows.md,
    },
    hero: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      ...shadows.lg,
    },
    glass: {
      backgroundColor: colors.background.glass,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      backdropFilter: 'blur(20px)',
      borderWidth: 1,
      borderColor: colors.border.light,
    },
  },
  
  // Button system
  button: {
    primary: {
      backgroundColor: colors.primary[500],
      borderRadius: borderRadius.md,
      height: 48,
      paddingHorizontal: spacing.xl,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      ...shadows.sm,
    },
    secondary: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
      height: 48,
      paddingHorizontal: spacing.xl,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.md,
      height: 48,
      paddingHorizontal: spacing.xl,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    fab: {
      backgroundColor: colors.primary[500],
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      ...shadows.brand,
    },
  },
  
  // Avatar system
  avatar: {
    xs: { width: 24, height: 24, borderRadius: 12 },
    sm: { width: 32, height: 32, borderRadius: 16 },
    md: { width: 40, height: 40, borderRadius: 20 },
    lg: { width: 48, height: 48, borderRadius: 24 },
    xl: { width: 64, height: 64, borderRadius: 32 },
    xxl: { width: 80, height: 80, borderRadius: 40 },
  },
  
  // Input system
  input: {
    default: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
      height: 48,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    focused: {
      borderColor: colors.primary[500],
      borderWidth: 2,
    },
  },
  
  // Badge system
  badge: {
    primary: {
      backgroundColor: colors.primary[500],
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
    },
    success: {
      backgroundColor: colors.success[500],
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
    },
    warning: {
      backgroundColor: colors.warning[500],
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
    },
  },
} as const;

// Animation system
export const animations = {
  timing: {
    fast: 150,
    normal: 200,
    slow: 300,
    lazy: 500,
  },
  
  spring: {
    gentle: {
      damping: 20,
      stiffness: 300,
    },
    bouncy: {
      damping: 15,
      stiffness: 400,
    },
    snappy: {
      damping: 25,
      stiffness: 500,
    },
  },
} as const;

// Layout constants
export const layout = {
  // Screen dimensions
  screenPadding: spacing.lg,
  sectionSpacing: spacing.xl,
  
  // Component heights
  headerHeight: 64,
  tabBarHeight: 80,
  cardHeight: 120,
  listItemHeight: 72,
  
  // Touch targets
  minTouchTarget: 44,
  
  // Unique layout constants
  heroCardHeight: 200,
  statsCardHeight: 100,
} as const;

// Gamification elements
export const gamification = {
  levels: {
    colors: [
      colors.neural.cyan,
      colors.neural.emerald,
      colors.primary[500],
      colors.neural.violet,
      colors.neural.rose,
      colors.neural.amber,
    ],
    badges: ['🌱', '🔥', '⚡', '💎', '👑', '🚀'],
  },
  
  streaks: {
    colors: {
      low: colors.gray[400],      // 1-3 days
      medium: colors.warning[500], // 4-7 days
      high: colors.error[500],     // 8-14 days
      legendary: colors.neural.violet, // 15+ days
    },
  },
  
  achievements: {
    rarities: {
      common: colors.gray[500],
      rare: colors.primary[500],
      epic: colors.neural.violet,
      legendary: colors.neural.amber,
    },
  },
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
  gamification,
};