# WayFind Frontend - Project Documentation

## Project Overview

WayFind is a React Native mobile application designed for group location tracking, safety, and communication. The app provides real-time location sharing, voice messaging, and safety features for groups such as riders, families, or teams.

**Technology Stack:**
- **Framework:** React Native with Expo
- **Navigation:** Expo Router (file-based routing)
- **Authentication:** Firebase Auth + Custom Backend
- **Location Services:** Expo Location
- **Audio:** Expo Audio
- **Maps:** React Native Maps
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Language:** JavaScript/TypeScript

## Current Features & Implementation Status

### ✅ Completed Features

#### Authentication System
- **Phone-based Login**: OTP verification using `react-native-otp-entry`
- **Profile Management**: User can update name and email
- **Token Management**: Secure storage with `expo-secure-store`
- **Session Persistence**: Automatic auth state restoration
- **Device Info Tracking**: Sends device information on login

#### Group Management
- **Create Groups**: Admin can create new groups
- **Group Listing**: Display all user groups with member counts
- **Group Joining**: Join groups via invite codes
- **Group Details**: View group information and members
- **Admin Controls**: Promote users to admin status

#### Location Tracking
- **Real-time Updates**: Location updates every 3 minutes
- **Background Tracking**: Continues tracking when app is in background
- **Permission Handling**: Proper location permission requests
- **High Accuracy**: GPS-based location with accuracy metrics
- **Backend Sync**: Location data sent to server with timestamps

#### Voice Communication
- **Voice Recording**: Record voice messages up to 30 seconds
- **Visual Feedback**: Recording timer and animated indicators
- **Audio Playback**: Auto-play incoming messages
- **High Quality**: Using `Audio.RecordingOptionsPresets.HIGH_QUALITY`

#### UI/UX Components
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Loading States**: Proper loading indicators throughout the app
- **Error Handling**: User-friendly error messages and alerts
- **Navigation**: Bottom tab navigation with proper routing
- **Theming**: Consistent color scheme and typography

### 🚧 In Progress Features

#### Map Visualization
- **Basic Map Display**: React Native Maps integration
- **Member Locations**: Display group members as map markers
- **Location Details**: Show member info on marker tap
- **Path Following**: Display route paths for group rides

#### Communication Features
- **Voice Message Storage**: Backend integration for audio files
- **Message History**: Voice message playback and management
- **Group Notifications**: Real-time updates for group activities

#### Safety Features
- **SOS Button**: Emergency alerts to all group admins
- **Gather Around**: Admin notification for meeting points
- **Member Tracking**: Real-time location visibility

### ❌ Pending Features

#### Advanced Group Features
- **Share Group Join Link**: Generate and share invite links
- **Ride Creation**: Admin creates rides with start/end points
- **Direction Integration**: Open Google Maps for member navigation
- **Auto-play Settings**: User preferences for message playback

#### Location Enhancements
- **Geofencing**: Automatic attendance based on location
- **Location History**: Track member movement patterns
- **Battery Optimization**: Efficient background tracking
- **Offline Support**: Cache location data when offline

## Architecture Overview

### Directory Structure

```
src/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (main)/            # Main app screens
│   └── index.js           # App entry point
├── components/            # Reusable UI components
│   ├── groups/           # Group-specific components
│   └── main/             # Main app components
├── apis/                 # API service layers
├── services/             # Business logic services
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── styles/               # Styling and themes
└── constants/            # App constants
```

### Key Components

#### Authentication Flow
1. **Login Screen** → OTP verification → Profile update → Main app
2. **AuthContext**: Manages authentication state globally
3. **AuthGuard**: Protects routes requiring authentication
4. **Token Management**: Secure storage and automatic refresh

#### Location Service Architecture
- **LocationTrackingService**: Singleton service for location management
- **Background Tasks**: Continuous location updates
- **Permission Management**: Runtime permission handling
- **Data Throttling**: Prevents excessive API calls

#### Group Management System
- **GroupService**: API layer for group operations
- **Real-time Updates**: Location sharing within groups
- **Admin Hierarchy**: Role-based permissions
- **Member Management**: Add/remove members from groups

## Auto Attendance Feature - Requirements & Implementation Plan

### 🎯 Objective
Implement automatic attendance tracking for group members based on location proximity and time-based check-ins.

### 📋 Requirements

#### Core Functionality
1. **Geofenced Attendance**: Automatically mark attendance when members enter designated areas
2. **Time-based Tracking**: Record check-in/check-out times with timestamps
3. **Group Session Management**: Create attendance sessions for specific events/rides
4. **Real-time Notifications**: Alert members when attendance is recorded
5. **Attendance History**: View past attendance records and statistics

#### Technical Requirements
1. **Geofencing Integration**: Define virtual perimeters for attendance zones
2. **Location Accuracy**: Ensure precise location detection for attendance
3. **Offline Support**: Cache attendance data when network is unavailable
4. **Battery Efficiency**: Optimize location monitoring for minimal battery drain
5. **Data Synchronization**: Sync attendance data across all group members

### 🔧 Implementation Plan

#### Phase 1: Backend API Development
- **Attendance Endpoints**: Create CRUD operations for attendance records
- **Geofence Management**: API to create/manage attendance zones
- **Session Management**: Handle attendance sessions for events
- **Real-time Updates**: WebSocket integration for live attendance updates

#### Phase 2: Frontend Implementation
- **Attendance Service**: Create `AttendanceService` for API communication
- **Geofence Monitor**: Background service for location-based attendance
- **Attendance UI**: Components for viewing attendance history and status
- **Notification System**: Local notifications for attendance events

#### Phase 3: Advanced Features
- **Analytics Dashboard**: Attendance statistics and reports
- **Automated Reports**: Generate attendance summaries
- **Integration Points**: Connect with ride creation and group features
- **Admin Controls**: Manage attendance settings and permissions

### 🏗️ Proposed Architecture Changes

#### New Files/Components
```
src/
├── services/
│   └── attendanceService.js      # Attendance API integration
├── hooks/
│   └── useAttendanceTracking.js  # Custom attendance hook
├── components/
│   └── attendance/
│       ├── AttendanceCard.js     # Attendance display component
│       ├── GeofenceMap.js        # Map with attendance zones
│       └── AttendanceHistory.js  # History view component
└── utils/
    └── geofencing.js            # Geofence utilities
```

#### Modified Files
- **locationService.js**: Add attendance check-in logic
- **GroupService**: Extend with attendance-related methods
- **Navigation**: Add attendance screens to routing
- **Context**: Add attendance state management

### 📊 Data Models

#### Attendance Record
```javascript
{
  id: string,
  userId: string,
  groupId: string,
  sessionId: string,
  checkInTime: Date,
  checkOutTime: Date,
  location: {
    latitude: number,
    longitude: number,
    accuracy: number
  },
  geofenceId: string,
  status: 'present' | 'absent' | 'late',
  metadata: object
}
```

#### Geofence Zone
```javascript
{
  id: string,
  groupId: string,
  name: string,
  center: {
    latitude: number,
    longitude: number
  },
  radius: number,
  isActive: boolean,
  schedule: {
    startTime: string,
    endTime: string,
    days: number[]
  }
}
```

### 🎨 UI/UX Considerations

#### Attendance Dashboard
- **Real-time Status**: Live attendance count and member status
- **Map View**: Visual representation of attendance zones and member locations
- **Quick Actions**: Mark manual attendance, create new sessions
- **Filters**: Filter by date, member, or attendance status

#### Member Experience
- **Automatic Check-ins**: Seamless background attendance recording
- **Notifications**: Clear feedback when attendance is marked
- **History Access**: Easy access to personal attendance records
- **Privacy Controls**: Options to control location sharing settings

### ⚠️ Technical Challenges & Solutions

#### Challenge 1: Battery Life
**Solution**: Implement intelligent location monitoring with adaptive intervals based on movement patterns and proximity to attendance zones.

#### Challenge 2: Location Accuracy
**Solution**: Use multiple location sources (GPS, WiFi, Cell towers) and implement accuracy thresholds for reliable attendance marking.

#### Challenge 3: Offline Support
**Solution**: Implement local storage with synchronization queue for attendance data when network connectivity is restored.

#### Challenge 4: Privacy Concerns
**Solution**: Provide granular privacy controls and clear communication about data usage and retention policies.

### 🔍 Testing Strategy

#### Unit Tests
- Attendance service API integration
- Geofencing calculation accuracy
- Location tracking reliability
- Data synchronization logic

#### Integration Tests
- End-to-end attendance flow
- Background location monitoring
- Real-time notification delivery
- Offline data sync scenarios

#### User Acceptance Tests
- UI/UX usability testing
- Battery consumption analysis
- Location accuracy validation
- Performance under various network conditions

## Development Guidelines

### Code Standards
- **ESLint Configuration**: Consistent code formatting and error prevention
- **TypeScript**: Gradual migration for better type safety
- **Component Structure**: Follow atomic design principles
- **State Management**: Use React Context for global state, local state for component-specific data

### Best Practices
- **Error Boundaries**: Implement proper error handling throughout the app
- **Performance**: Optimize re-renders and minimize unnecessary computations
- **Security**: Secure token storage and proper API authentication
- **Accessibility**: Follow React Native accessibility guidelines

### Testing Requirements
- **Jest**: Unit and integration testing
- **React Native Testing Library**: Component testing
- **E2E Testing**: Detox or Expo's testing solutions
- **Manual Testing**: Device-specific functionality testing

## Deployment & Maintenance

### Build Configuration
- **Environment Variables**: Separate configs for development, staging, production
- **Bundle Optimization**: Proper bundle splitting and lazy loading
- **Asset Management**: Optimized images and fonts
- **Native Dependencies**: Regular updates and compatibility checks

### Monitoring & Analytics
- **Crash Reporting**: Implement crash analytics (e.g., Sentry)
- **Performance Monitoring**: Track app performance metrics
- **User Analytics**: Understand user behavior and feature usage
- **API Monitoring**: Track backend performance and errors

## Next Steps

1. **Immediate**: Complete map visualization and basic location sharing
2. **Short-term**: Implement auto attendance backend APIs
3. **Medium-term**: Develop frontend attendance features
4. **Long-term**: Add advanced analytics and reporting capabilities

---

*This document is a living reference and should be updated as the project evolves. Last updated: December 2025*
