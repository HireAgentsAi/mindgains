export const theme = {
  colors: {
    background: {
      primary: '#0f0f23',
      secondary: '#1a1a2e',
      tertiary: '#16213e',
      card: '#1e1e35',
      overlay: 'rgba(15, 15, 35, 0.95)',
    },
    gradient: {
      primary: ['#8b5cf6', '#3b82f6', '#06b6d4'],
      secondary: ['#f59e0b', '#ef4444', '#ec4899'],
      success: ['#10b981', '#059669'],
      warning: ['#f59e0b', '#d97706'],
      error: ['#ef4444', '#dc2626'],
      mascot: ['#a855f7', '#3b82f6'],
    },
    text: {
      primary: '#ffffff',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      muted: '#64748b',
    },
    accent: {
      purple: '#8b5cf6',
      blue: '#3b82f6',
      cyan: '#06b6d4',
      yellow: '#fbbf24',
      green: '#10b981',
      pink: '#ec4899',
    },
    border: {
      primary: 'rgba(139, 92, 246, 0.3)',
      secondary: 'rgba(59, 130, 246, 0.2)',
      tertiary: 'rgba(148, 163, 184, 0.1)',
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
};

export type Theme = typeof theme;