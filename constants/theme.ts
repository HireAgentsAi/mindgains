// MindGains AI - Professional Design System with Playful Elements
export const theme = {
  colors: {
    background: {
      primary: '#0f0f23',
      secondary: '#1a1a2e',
      tertiary: '#16213e',
      card: '#1e1e35',
      overlay: 'rgba(15, 15, 35, 0.95)',
      glass: 'rgba(30, 30, 53, 0.8)',
    },
    gradient: {
      primary: ['#8b5cf6', '#3b82f6', '#06b6d4'],
      secondary: ['#f59e0b', '#ef4444', '#ec4899'],
      success: ['#10b981', '#059669'],
      warning: ['#f59e0b', '#d97706'],
      error: ['#ef4444', '#dc2626'],
      mascot: ['#a855f7', '#3b82f6'],
      gold: ['#fbbf24', '#f59e0b'],
      silver: ['#e5e7eb', '#9ca3af'],
      bronze: ['#d97706', '#92400e'],
    },
    text: {
      primary: '#ffffff',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      muted: '#64748b',
      inverse: '#0f0f23',
    },
    accent: {
      purple: '#8b5cf6',
      blue: '#3b82f6',
      cyan: '#06b6d4',
      yellow: '#fbbf24',
      green: '#10b981',
      pink: '#ec4899',
      gold: '#fbbf24',
      silver: '#e5e7eb',
      bronze: '#d97706',
    },
    border: {
      primary: 'rgba(139, 92, 246, 0.3)',
      secondary: 'rgba(59, 130, 246, 0.2)',
      tertiary: 'rgba(148, 163, 184, 0.1)',
      light: 'rgba(255, 255, 255, 0.1)',
    },
    status: {
      online: '#10b981',
      studying: '#f59e0b',
      offline: '#6b7280',
    },
    league: {
      diamond: '#e0e7ff',
      emerald: '#10b981',
      sapphire: '#3b82f6',
      ruby: '#ef4444',
      gold: '#fbbf24',
      silver: '#9ca3af',
      bronze: '#d97706',
    },
  },
  fonts: {
    heading: 'Poppins-Bold',
    subheading: 'Poppins-SemiBold',
    body: 'Poppins-Medium',
    caption: 'Inter-Medium',
    regular: 'Poppins-Regular',
  },
  shadows: {
    card: {
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    button: {
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 15,
    },
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  animations: {
    timing: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    spring: {
      gentle: { damping: 20, stiffness: 300 },
      bouncy: { damping: 15, stiffness: 400 },
      snappy: { damping: 25, stiffness: 500 },
    },
  },
  gamification: {
    levels: {
      colors: [
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#8b5cf6', // Purple
        '#a855f7', // Violet
        '#ec4899', // Pink
        '#fbbf24', // Amber
      ],
      badges: ['🌱', '🔥', '⚡', '💎', '👑', '🚀'],
    },
    streaks: {
      colors: {
        low: '#9ca3af',      // 1-3 days
        medium: '#f59e0b',   // 4-7 days
        high: '#ef4444',     // 8-14 days
        legendary: '#a855f7', // 15+ days
      },
    },
    achievements: {
      rarities: {
        common: '#6b7280',
        rare: '#3b82f6',
        epic: '#8b5cf6',
        legendary: '#fbbf24',
      },
    },
  },
};

export type Theme = typeof theme;