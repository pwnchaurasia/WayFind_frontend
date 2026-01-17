export const theme = {
  colors: {
    // Background colors
    background: '#1C1C23',
    surface: '#2A2A2A',
    inputBg: '#17171C',
    inputBoxBg: '#17171C',

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

    // error colors
    errorBorderColor: '#FF6B6B',
    errorTextColor: '#FF6B6B',

    // button
    buttonBackgroundGreen: 'rgba(0, 200, 83, 0.1)'

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

  // DatePicker styles for react-native-ui-datepicker
  datePickerStyles: {
    // Days grid
    days: { backgroundColor: '#1C1C23' },
    day: { backgroundColor: 'transparent' },
    day_cell: { backgroundColor: 'transparent' },
    day_label: { color: '#FFFFFF' },
    // Header
    header: { backgroundColor: '#1C1C23' },
    month_selector: { backgroundColor: 'transparent' },
    month_selector_label: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    year_selector: { backgroundColor: 'transparent' },
    year_selector_label: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    time_selector: { backgroundColor: '#2A2A2A', borderRadius: 8 },
    time_selector_label: { color: '#FFFFFF' },
    // Weekdays
    weekdays: { backgroundColor: '#1C1C23' },
    weekday: { backgroundColor: 'transparent' },
    weekday_label: { color: '#9E9E9E' },
    // Today
    today: { borderColor: '#00C851', borderWidth: 1, borderRadius: 20 },
    today_label: { color: '#00C851' },
    // Selected
    selected: { backgroundColor: '#00C851', borderRadius: 20 },
    selected_label: { color: '#FFFFFF', fontWeight: 'bold' },
    // Months grid
    months: { backgroundColor: '#1C1C23' },
    month: { backgroundColor: 'transparent' },
    month_label: { color: '#FFFFFF' },
    selected_month: { backgroundColor: '#00C851', borderRadius: 8 },
    selected_month_label: { color: '#FFFFFF', fontWeight: 'bold' },
    // Years grid
    years: { backgroundColor: '#1C1C23' },
    year: { backgroundColor: 'transparent' },
    year_label: { color: '#FFFFFF' },
    selected_year: { backgroundColor: '#00C851', borderRadius: 8 },
    selected_year_label: { color: '#FFFFFF', fontWeight: 'bold' },
    active_year: { backgroundColor: 'transparent', borderColor: '#00C851', borderWidth: 1, borderRadius: 8 },
    active_year_label: { color: '#00C851' },
    // Time picker
    time_label: { color: '#FFFFFF' },
    time_selected_indicator: { backgroundColor: 'rgba(0, 200, 81, 0.2)' },
    // Outside days
    outside: { backgroundColor: 'transparent' },
    outside_label: { color: '#666666' },
    // Disabled
    disabled: { backgroundColor: 'transparent' },
    disabled_label: { color: '#444444' },
    // Navigation buttons
    button_prev: { backgroundColor: 'transparent' },
    button_next: { backgroundColor: 'transparent' },
  },
};
