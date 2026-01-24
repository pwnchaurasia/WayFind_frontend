/**
 * ActivityFeed - WhatsApp-style activity feed for live rides
 * Shows real-time events: arrivals, check-ins, alerts, etc.
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    Animated,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';

// Activity type configurations
const ACTIVITY_CONFIG = {
    // Attendance activities
    arrived_meetup: {
        icon: 'check-circle',
        iconFamily: 'Feather',
        color: '#00C853',
        bgColor: 'rgba(0, 200, 83, 0.15)',
        label: 'Arrived at Meetup'
    },
    checked_in_stop: {
        icon: 'map-pin',
        iconFamily: 'Feather',
        color: '#2196F3',
        bgColor: 'rgba(33, 150, 243, 0.15)',
        label: 'Checked in at Stop'
    },
    reached_destination: {
        icon: 'flag',
        iconFamily: 'Feather',
        color: '#FF9800',
        bgColor: 'rgba(255, 152, 0, 0.15)',
        label: 'Reached Destination'
    },
    reached_home: {
        icon: 'home',
        iconFamily: 'Feather',
        color: '#4CAF50',
        bgColor: 'rgba(76, 175, 80, 0.15)',
        label: 'Reached Home'
    },

    // Ride lifecycle
    ride_started: {
        icon: 'play-circle',
        iconFamily: 'Feather',
        color: '#00C853',
        bgColor: 'rgba(0, 200, 83, 0.15)',
        label: 'Ride Started'
    },
    ride_ended: {
        icon: 'stop-circle',
        iconFamily: 'Feather',
        color: '#666',
        bgColor: 'rgba(102, 102, 102, 0.15)',
        label: 'Ride Ended'
    },

    // User actions
    user_joined: {
        icon: 'user-plus',
        iconFamily: 'Feather',
        color: '#2196F3',
        bgColor: 'rgba(33, 150, 243, 0.15)',
        label: 'Joined Ride'
    },
    user_left: {
        icon: 'user-minus',
        iconFamily: 'Feather',
        color: '#FF5252',
        bgColor: 'rgba(255, 82, 82, 0.15)',
        label: 'Left Ride'
    },

    // Alerts
    sos_alert: {
        icon: 'alert-circle',
        iconFamily: 'Feather',
        color: '#FF1744',
        bgColor: 'rgba(255, 23, 68, 0.2)',
        label: '🚨 SOS ALERT',
        priority: true
    },
    low_fuel: {
        icon: 'local-gas-station',
        iconFamily: 'MaterialIcons',
        color: '#FF9800',
        bgColor: 'rgba(255, 152, 0, 0.15)',
        label: 'Low Fuel'
    },
    breakdown: {
        icon: 'build',
        iconFamily: 'Feather',
        color: '#FF5252',
        bgColor: 'rgba(255, 82, 82, 0.15)',
        label: 'Breakdown'
    },
    need_help: {
        icon: 'help-circle',
        iconFamily: 'Feather',
        color: '#FF9800',
        bgColor: 'rgba(255, 152, 0, 0.15)',
        label: 'Needs Help'
    }
};

const DEFAULT_CONFIG = {
    icon: 'activity',
    iconFamily: 'Feather',
    color: '#888',
    bgColor: 'rgba(136, 136, 136, 0.15)',
    label: 'Activity'
};

// Format time ago
const formatTimeAgo = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

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

// Activity Item Component
const ActivityItem = ({ activity, isNew }) => {
    const config = ACTIVITY_CONFIG[activity.activity_type] || DEFAULT_CONFIG;
    const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
    const slideAnim = useRef(new Animated.Value(isNew ? 20 : 0)).current;

    useEffect(() => {
        if (isNew) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [isNew]);

    const renderIcon = () => {
        if (config.iconFamily === 'Ionicons') {
            return <Ionicons name={config.icon} size={18} color={config.color} />;
        }
        return <Feather name={config.icon} size={18} color={config.color} />;
    };

    return (
        <Animated.View
            style={[
                styles.activityItem,
                config.priority && styles.priorityItem,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            {/* User Avatar or Icon */}
            <View style={styles.avatarContainer}>
                {activity.user?.profile_picture ? (
                    <Image
                        source={{ uri: activity.user.profile_picture }}
                        style={styles.avatar}
                    />
                ) : activity.user?.name ? (
                    <View style={[styles.avatar, { backgroundColor: getAvatarColor(activity.user.name) }]}>
                        <Text style={styles.avatarText}>{getInitials(activity.user.name)}</Text>
                    </View>
                ) : (
                    <View style={[styles.iconBadge, { backgroundColor: config.bgColor }]}>
                        {renderIcon()}
                    </View>
                )}
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                <Text style={styles.message} numberOfLines={2}>
                    {activity.message || config.label}
                </Text>

                <View style={styles.metaRow}>
                    <Text style={styles.timeText}>{formatTimeAgo(activity.created_at)}</Text>

                    {activity.checkpoint && (
                        <View style={styles.checkpointBadge}>
                            <Feather name="map-pin" size={10} color={theme.colors.textSecondary} />
                            <Text style={styles.checkpointText}>
                                {activity.checkpoint.type?.replace('_', ' ')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Status Icon */}
            <View style={[styles.statusIcon, { backgroundColor: config.bgColor }]}>
                {renderIcon()}
            </View>
        </Animated.View>
    );
};

// Empty State
const EmptyState = () => (
    <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="timeline-text" size={48} color="#444" />
        </View>
        <Text style={styles.emptyTitle}>No Activity Yet</Text>
        <Text style={styles.emptySubtitle}>
            Events will appear here as the ride progresses
        </Text>
    </View>
);

// Main ActivityFeed Component
const ActivityFeed = ({
    activities = [],
    loading = false,
    onRefresh = null,
    refreshing = false,
    newActivityIds = new Set()
}) => {
    const flatListRef = useRef(null);

    // Scroll to top when new activity arrives
    useEffect(() => {
        if (activities.length > 0 && newActivityIds.size > 0) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }, [activities.length]);

    const renderItem = ({ item, index }) => (
        <ActivityItem
            activity={item}
            isNew={newActivityIds.has(item.id)}
        />
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={activities}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    activities.length === 0 && styles.emptyListContent
                ]}
                ListEmptyComponent={!loading ? <EmptyState /> : null}
                showsVerticalScrollIndicator={false}
                onRefresh={onRefresh}
                refreshing={refreshing}
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
        paddingVertical: 8,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    priorityItem: {
        backgroundColor: 'rgba(255, 23, 68, 0.08)',
        borderLeftWidth: 3,
        borderLeftColor: '#FF1744',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    message: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    timeText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    checkpointBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    checkpointText: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        textTransform: 'capitalize',
    },
    statusIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
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

export default ActivityFeed;
