/**
 * RidersList - Shows all ride participants with their status
 * Includes attendance status, location status, and quick actions
 */

import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';

// Generate avatar initials
const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

// Get avatar color based on name
const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

// Format time ago
const formatTimeAgo = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Offline';
};

// Get attendance status badge config
const getAttendanceConfig = (status) => {
    switch (status) {
        case 'present':
            return {
                icon: 'check-circle',
                color: '#00C853',
                bgColor: 'rgba(0, 200, 83, 0.15)',
                label: 'Present'
            };
        case 'absent':
            return {
                icon: 'x-circle',
                color: '#FF5252',
                bgColor: 'rgba(255, 82, 82, 0.15)',
                label: 'Absent'
            };
        default:
            return {
                icon: 'clock',
                color: '#888',
                bgColor: 'rgba(136, 136, 136, 0.15)',
                label: 'Pending'
            };
    }
};

// Rider Item Component
const RiderItem = ({ rider, isAdmin, onCallPress, onDirectionsPress, currentUserId }) => {
    const isCurrentUser = rider.user_id === currentUserId;
    const attendanceConfig = getAttendanceConfig(rider.attendance_status);
    const hasLocation = rider.latitude && rider.longitude;
    const locationAge = formatTimeAgo(rider.last_updated);
    const isActive = locationAge === 'Active now' || locationAge === 'Just now';

    return (
        <View style={[styles.riderItem, isCurrentUser && styles.currentUserItem]}>
            {/* Avatar with status indicator */}
            <View style={styles.avatarContainer}>
                {rider.profile_picture ? (
                    <Image
                        source={{ uri: rider.profile_picture }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: getAvatarColor(rider.name) }]}>
                        <Text style={styles.avatarText}>{getInitials(rider.name)}</Text>
                    </View>
                )}

                {/* Online status dot */}
                <View style={[
                    styles.statusDot,
                    isActive ? styles.statusOnline : styles.statusOffline
                ]} />
            </View>

            {/* Rider Info */}
            <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {rider.name || 'Unknown'}
                        {isCurrentUser && <Text style={styles.youLabel}> (You)</Text>}
                    </Text>

                    {/* Attendance Badge */}
                    <View style={[styles.attendanceBadge, { backgroundColor: attendanceConfig.bgColor }]}>
                        <Feather name={attendanceConfig.icon} size={12} color={attendanceConfig.color} />
                        <Text style={[styles.attendanceText, { color: attendanceConfig.color }]}>
                            {attendanceConfig.label}
                        </Text>
                    </View>
                </View>

                {/* Location Status */}
                <View style={styles.locationRow}>
                    {hasLocation ? (
                        <>
                            <Feather
                                name="navigation"
                                size={12}
                                color={isActive ? theme.colors.primary : '#666'}
                            />
                            <Text style={[
                                styles.locationText,
                                isActive && styles.activeLocationText
                            ]}>
                                {locationAge}
                                {rider.speed && rider.speed > 0 && ` • ${Math.round(rider.speed)} km/h`}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Feather name="map-pin" size={12} color="#666" />
                            <Text style={styles.locationText}>No location data</Text>
                        </>
                    )}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                {hasLocation && !isCurrentUser && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onDirectionsPress?.(rider)}
                    >
                        <MaterialCommunityIcons name="directions" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                )}

                {isAdmin && !isCurrentUser && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onCallPress?.(rider)}
                    >
                        <Feather name="phone" size={18} color="#4CAF50" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// Stats Header
const StatsHeader = ({ riders }) => {
    const present = riders.filter(r => r.attendance_status === 'present').length;
    const withLocation = riders.filter(r => r.latitude && r.longitude).length;
    const active = riders.filter(r => {
        if (!r.last_updated) return false;
        const diffMs = Date.now() - new Date(r.last_updated).getTime();
        return diffMs < 300000; // Active in last 5 mins
    }).length;

    return (
        <View style={styles.statsHeader}>
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{riders.length}</Text>
                <Text style={styles.statLabel}>Riders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#00C853' }]}>{present}</Text>
                <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>{active}</Text>
                <Text style={styles.statLabel}>Active</Text>
            </View>
        </View>
    );
};

// Empty State
const EmptyState = () => (
    <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
            <Feather name="users" size={48} color="#444" />
        </View>
        <Text style={styles.emptyTitle}>No Riders</Text>
        <Text style={styles.emptySubtitle}>
            Riders will appear here when they share their location
        </Text>
    </View>
);

// Main RidersList Component
const RidersList = ({
    riders = [],
    isAdmin = false,
    currentUserId = null,
    onCallRider = null,
    onNavigateToRider = null,
    loading = false
}) => {
    const handleCall = (rider) => {
        // In real app, you'd have phone number from admin data
        if (onCallRider) {
            onCallRider(rider);
        }
    };

    const handleDirections = (rider) => {
        if (onNavigateToRider) {
            onNavigateToRider(rider);
        }
    };

    // Sort: Current user first, then by attendance status, then by activity
    const sortedRiders = [...riders].sort((a, b) => {
        // Current user first
        if (a.user_id === currentUserId) return -1;
        if (b.user_id === currentUserId) return 1;

        // Present riders first
        if (a.attendance_status === 'present' && b.attendance_status !== 'present') return -1;
        if (b.attendance_status === 'present' && a.attendance_status !== 'present') return 1;

        // Then by most recently active
        if (a.last_updated && b.last_updated) {
            return new Date(b.last_updated) - new Date(a.last_updated);
        }
        return 0;
    });

    const renderItem = ({ item }) => (
        <RiderItem
            rider={item}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            onCallPress={handleCall}
            onDirectionsPress={handleDirections}
        />
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={sortedRiders}
                renderItem={renderItem}
                keyExtractor={(item) => item.user_id}
                ListHeaderComponent={riders.length > 0 ? <StatsHeader riders={riders} /> : null}
                ListEmptyComponent={!loading ? <EmptyState /> : null}
                contentContainerStyle={[
                    styles.listContent,
                    riders.length === 0 && styles.emptyListContent
                ]}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.border,
    },
    riderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    currentUserItem: {
        backgroundColor: 'rgba(0, 200, 83, 0.05)',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    statusDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    statusOnline: {
        backgroundColor: '#00C853',
    },
    statusOffline: {
        backgroundColor: '#666',
    },
    infoContainer: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    name: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    youLabel: {
        color: theme.colors.primary,
        fontWeight: '400',
    },
    attendanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    attendanceText: {
        fontSize: 11,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    locationText: {
        color: '#666',
        fontSize: 13,
    },
    activeLocationText: {
        color: theme.colors.primary,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptySubtitle: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
});

export default RidersList;
