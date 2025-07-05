import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  containerWithPadding: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  
  surface: {
    backgroundColor: theme.colors.surface,
  },
  
  // Text styles
  textPrimary: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
  },
  
  textSecondary: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  
  textMuted: {
    color: theme.colors.mutedText,
    fontSize: theme.fontSize.sm,
  },
  
  textBold: {
    fontWeight: theme.fontWeight.bold,
  },
  
  textSemibold: {
    fontWeight: theme.fontWeight.semibold,
  },
  
  textMedium: {
    fontWeight: theme.fontWeight.medium,
  },
  
  // Input styles
  input: {
    backgroundColor: theme.colors.inputBg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
    fontSize: theme.fontSize.lg,
    color: theme.colors.inputText,
    height: theme.dimensions.inputHeight,
  },
  
  inputFocused: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  
  // Button styles
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
    height: theme.dimensions.buttonHeight,
    justifyContent: 'center',
  },
  
  buttonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
  
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  
  buttonOutlineText: {
    color: theme.colors.primary,
  },
  
  // Avatar styles
  avatar: {
    width: theme.dimensions.avatarMedium,
    height: theme.dimensions.avatarMedium,
    borderRadius: theme.dimensions.avatarMedium / 2,
  },
  
  avatarSmall: {
    width: theme.dimensions.avatarSmall,
    height: theme.dimensions.avatarSmall,
    borderRadius: theme.dimensions.avatarSmall / 2,
  },
  
  avatarLarge: {
    width: theme.dimensions.avatarLarge,
    height: theme.dimensions.avatarLarge,
    borderRadius: theme.dimensions.avatarLarge / 2,
  },
  
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  avatarText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.bold,
  },
  
  avatarTextSmall: {
    fontSize: theme.fontSize.sm,
  },
  
  avatarTextMedium: {
    fontSize: theme.fontSize.md,
  },
  
  avatarTextLarge: {
    fontSize: theme.fontSize.xl,
  },
  
  // Card styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  
  cardSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  
  listItemContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  
  listItemTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  
  listItemSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  // Header styles
  header: {
    backgroundColor: theme.colors.surface,
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  
  headerButton: {
    padding: theme.spacing.sm,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: `rgba(0, 0, 0, ${theme.opacity.overlay})`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    maxWidth: '90%',
    ...theme.shadows.large,
  },
  
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  
  loadingText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    marginTop: theme.spacing.md,
  },
  
  // Status indicators
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  
  offlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.textSecondary,
  },
  
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.xs,
  },
  
  // Message styles
  messageContainer: {
    marginBottom: theme.spacing.lg,
  },
  
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  
  ownMessageRow: {
    flexDirection: 'row-reverse',
  },
  
  messageContent: {
    maxWidth: '70%',
  },
  
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  
  senderName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  
  messageTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  ownMessageTime: {
    textAlign: 'right',
  },
  
  // Audio message styles
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    minWidth: 250,
  },
  
  ownAudioMessage: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  // Waveform styles
  waveform: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    justifyContent: 'space-between',
  },
  
  waveformBar: {
    width: 3,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: 0.5,
    borderRadius: 1.5,
  },
  
  // Voice recorder styles
  voiceRecorderContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  voiceRecorderContainerAndroid: {
    bottom: 70,
  },
  
  recordingInfo: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xxl,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    minWidth: 200,
    ...theme.shadows.medium,
  },
  
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    marginRight: theme.spacing.sm,
  },
  
  recordingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  
  cancelButton: {
    padding: theme.spacing.xs,
  },
  
  timerText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  
  hintText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  micButtonContainer: {
    ...theme.shadows.large,
  },
  
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  recordingButton: {
    backgroundColor: '#FF1744',
  },
  
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    marginTop: theme.spacing.md,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.error,
    borderRadius: 2,
  },
  
  // Map styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  
  map: {
    flex: 1,
  },
  
  mapControls: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'column',
  },
  
  controlButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  
  // Map marker styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  markerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  
  markerPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  
  markerText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  
  offlineMarker: {
    opacity: theme.opacity.disabled,
    borderColor: theme.colors.textSecondary,
  },
  
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: 2,
  },
  
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  
  nameLabel: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginTop: 5,
    ...theme.shadows.small,
  },
  
  nameLabelText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  
  currentLocationMarker: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
  },
  
  currentLocationCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${theme.colors.primary}30`,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  
  // User info card styles
  userInfoCard: {
    position: 'absolute',
    bottom: 180,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1,
  },
  
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  userInfoAvatar: {
    width: theme.dimensions.avatarLarge,
    height: theme.dimensions.avatarLarge,
    borderRadius: theme.dimensions.avatarLarge / 2,
    marginRight: theme.spacing.md,
  },
  
  userInfoAvatarPlaceholder: {
    width: theme.dimensions.avatarLarge,
    height: theme.dimensions.avatarLarge,
    borderRadius: theme.dimensions.avatarLarge / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  userInfoAvatarText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  
  userInfoDetails: {
    flex: 1,
  },
  
  userInfoName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  
  userInfoStatus: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  
  userInfoAccuracy: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  
  // Users list styles
  usersListContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.lg,
    maxHeight: 140,
  },
  
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  
  usersList: {
    paddingLeft: theme.spacing.lg,
  },
  
  usersListContent: {
    paddingRight: theme.spacing.lg,
  },
  
  userCard: {
    width: 80,
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  
  selectedUserCard: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  
  userCardAvatar: {
    width: theme.dimensions.avatarMedium,
    height: theme.dimensions.avatarMedium,
    borderRadius: theme.dimensions.avatarMedium / 2,
    marginBottom: theme.spacing.xs,
  },
  
  userCardAvatarPlaceholder: {
    width: theme.dimensions.avatarMedium,
    height: theme.dimensions.avatarMedium,
    borderRadius: theme.dimensions.avatarMedium / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  userCardAvatarText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  
  userCardName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  
  userCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  userCardStatusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  
  // Dropdown styles
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 150,
    ...theme.shadows.medium,
  },
  
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  
  dropdownText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
  },
  
  // Utility styles
  flexRow: {
    flexDirection: 'row',
  },
  
  flexColumn: {
    flexDirection: 'column',
  },
  
  alignCenter: {
    alignItems: 'center',
  },
  
  justifyCenter: {
    justifyContent: 'center',
  },
  
  flexCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  flex1: {
    flex: 1,
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  textRight: {
    textAlign: 'right',
  },
  
  marginTop: {
    marginTop: theme.spacing.md,
  },
  
  marginBottom: {
    marginBottom: theme.spacing.md,
  },
  
  marginHorizontal: {
    marginHorizontal: theme.spacing.md,
  },
  
  marginVertical: {
    marginVertical: theme.spacing.md,
  },
  
  paddingHorizontal: {
    paddingHorizontal: theme.spacing.md,
  },
  
  paddingVertical: {
    paddingVertical: theme.spacing.md,
  },
});

// Helper functions for common patterns
export const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return theme.colors.avatarColors[Math.abs(hash) % theme.colors.avatarColors.length];
};

export const generateInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDuration = (milliseconds) => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getTimeSince = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
