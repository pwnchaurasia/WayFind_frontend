export const theme = {
  colors: {
    // Background colors
    background: '#1c1c23',
    surface: '#2A2A2A',
    inputBg: '#17171C',
    
    // Text colors
    text: '#ffffff',
    textPrimary: '#FFFFFF',
    textSecondary: '#9E9E9E',
    mutedText: '#A1A1A1',
    placeholderText: '#666666',
    inputText: '#ffffff',
    
    // Primary colors
    primary: '#00C851',
    secondary: '#6C757D',
    
    // Status colors
    success: '#27AE60',
    error: '#EB5757',
    warning: '#FF8800',
    
    // Interactive colors
    iconHighlightStart: '#47ED73',
    iconHighlightEnd: '#10A62B',
    micColorStart: '#F02037',
    micColorEnd: '#D30B21',
    iconShade: '#4A4E51',
    
    // UI elements
    border: '#333333',
    borderColor: '#353540',
    divider: '#E0E0E0',
    notificationDot: '#FF0000',
    
    // Avatar colors for initials
    avatarColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'],
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 20,
    xxl: 25,
    full: 9999,
  },
  
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 28,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  
  dimensions: {
    avatarSmall: 32,
    avatarMedium: 40,
    avatarLarge: 60,
    buttonHeight: 48,
    inputHeight: 48,
    headerHeight: 60,
    tabBarHeight: 80,
  },
  
  opacity: {
    disabled: 0.6,
    overlay: 0.5,
    subtle: 0.3,
    faint: 0.2,
  },
};
