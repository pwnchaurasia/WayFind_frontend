import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const COLORS = {
    primary: '#0df24a',
    backgroundDark: '#102215',
    cardDark: 'rgba(255, 255, 255, 0.05)',
    text: '#ffffff',
    textDim: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.1)',
    danger: '#FF5252',
    accent: '#3B82F6' // Blue for system
};

// --- SAMPLE DATA ---
const INITIAL_NOTIFICATIONS = [
    {
        id: '1',
        type: 'badge',
        title: 'New Badge Unlocked!',
        message: "You've earned the 'Early Bird' badge for completing 5 morning rides.",
        timestamp: dayjs().subtract(2, 'hour').toISOString(),
        read: false,
        actionUrl: '/(main)/(tabs)/profile'
    },
    {
        id: '2',
        type: 'system',
        title: 'System Update',
        message: 'WayFind v2.0 is live! Check out the new Rides Tab features.',
        timestamp: dayjs().subtract(1, 'day').toISOString(),
        read: true,
        actionUrl: null
    },
    {
        id: '3',
        type: 'ride',
        title: 'Ride Reminder',
        message: "Upcoming: 'Sunday Morning Loop' starts in 1 hour.",
        timestamp: dayjs().add(1, 'hour').toISOString(), // Future? No, reminder was sent now about future.
        // Let's say it was sent 30 mins ago.
        timestamp: dayjs().subtract(30, 'minute').toISOString(),
        read: false,
        actionUrl: '/(main)/rides/123'
    },
    {
        id: '4',
        type: 'invite',
        title: 'Squad Invite',
        message: "Alex invited you to join 'Red Rock Racers' squad.",
        timestamp: dayjs().subtract(2, 'day').toISOString(),
        read: true,
        actionUrl: '/(main)/(tabs)/community'
    },
    {
        id: '5',
        type: 'mention',
        title: 'New Mention',
        message: "@sarah mentioned you in 'Weekend Plan' chat.",
        timestamp: dayjs().subtract(3, 'day').toISOString(),
        read: true,
        actionUrl: null
    }
];

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handlePress = (item) => {
        markAsRead(item.id);
        if (item.actionUrl) {
            // router.push(item.actionUrl); // For now just mark read
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'badge': return { name: 'trophy', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' };
            case 'system': return { name: 'information', color: COLORS.accent, bg: 'rgba(59, 130, 246, 0.1)' };
            case 'ride': return { name: 'bike', color: COLORS.primary, bg: 'rgba(13, 242, 74, 0.1)' };
            case 'invite': return { name: 'account-plus', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)' };
            case 'mention': return { name: 'at', color: '#F472B6', bg: 'rgba(244, 114, 182, 0.1)' };
            default: return { name: 'bell', color: COLORS.textDim, bg: 'rgba(255,255,255,0.05)' };
        }
    };

    const renderItem = ({ item }) => {
        const icon = getIcon(item.type);
        return (
            <TouchableOpacity
                style={[styles.notificationItem, !item.read && styles.unreadItem]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                    <MaterialCommunityIcons name={icon.name} size={24} color={icon.color} />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
                        <Text style={styles.time}>{dayjs(item.timestamp).fromNow()}</Text>
                    </View>
                    <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={markAllRead}>
                    <Text style={styles.markReadText}>Mark all read</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bell-off-outline" size={48} color={COLORS.textDim} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    markReadText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: COLORS.cardDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 12,
    },
    unreadItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        gap: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e2e8f0',
        flex: 1,
    },
    unreadTitle: {
        color: 'white',
        fontWeight: '700',
    },
    time: {
        fontSize: 12,
        color: COLORS.textDim,
        marginLeft: 8,
    },
    message: {
        fontSize: 13,
        color: COLORS.textDim,
        lineHeight: 18,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginTop: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 16,
    },
    emptyText: {
        color: COLORS.textDim,
        fontSize: 16,
    },
});
