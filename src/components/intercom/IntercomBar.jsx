/**
 * IntercomBar Component - Floating UI for Universal Intercom
 * 
 * Shows:
 * - Connection status
 * - Lead info (who is broadcasting)
 * - Speaking indicator
 * - Quick controls
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useIntercom, IntercomState } from '@/src/hooks/useIntercom';

/**
 * IntercomBar - Displays intercom status and controls
 * @param {string} rideId - The ride UUID
 * @param {boolean} visible - Whether to show the bar
 * @param {boolean} isRideActive - Whether the ride is currently active
 */
export default function IntercomBar({ rideId, visible = true, isRideActive = false }) {
    const {
        state,
        isConnected,
        isLead,
        leadInfo,
        isSpeaking,
        error,
        connect,
        disconnect,
    } = useIntercom(rideId, visible && isRideActive);

    const [expanded, setExpanded] = useState(false);

    if (!visible || !isRideActive) return null;

    const getStatusColor = () => {
        switch (state) {
            case IntercomState.CONNECTED:
                return '#00C853'; // Green
            case IntercomState.CONNECTING:
            case IntercomState.RECONNECTING:
                return '#FF9800'; // Orange
            case IntercomState.ERROR:
                return '#FF4444'; // Red
            default:
                return '#666'; // Gray
        }
    };

    const getStatusIcon = () => {
        switch (state) {
            case IntercomState.CONNECTED:
                return isLead ? 'mic' : 'headphones';
            case IntercomState.CONNECTING:
            case IntercomState.RECONNECTING:
                return 'loader';
            case IntercomState.ERROR:
                return 'alert-circle';
            default:
                return 'mic-off';
        }
    };

    const getStatusText = () => {
        switch (state) {
            case IntercomState.CONNECTED:
                if (isLead) return 'Broadcasting';
                if (isSpeaking) return `${leadInfo?.name || 'Lead'} speaking`;
                return 'Listening';
            case IntercomState.CONNECTING:
                return 'Connecting...';
            case IntercomState.RECONNECTING:
                return 'Reconnecting...';
            case IntercomState.ERROR:
                return error || 'Connection Error';
            default:
                return 'Intercom Off';
        }
    };

    const handlePress = () => {
        if (state === IntercomState.DISCONNECTED || state === IntercomState.ERROR) {
            connect();
        } else {
            setExpanded(!expanded);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setExpanded(false);
    };

    return (
        <View style={styles.container}>
            {/* Main Bar */}
            <TouchableOpacity
                style={[styles.bar, { borderColor: getStatusColor() }]}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                {/* Status Icon */}
                <View style={[styles.iconContainer, { backgroundColor: getStatusColor() }]}>
                    {state === IntercomState.CONNECTING || state === IntercomState.RECONNECTING ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Feather name={getStatusIcon()} size={18} color="#fff" />
                    )}
                </View>

                {/* Status Text */}
                <View style={styles.textContainer}>
                    <Text style={styles.statusText} numberOfLines={1}>
                        {getStatusText()}
                    </Text>
                    {isConnected && leadInfo && !isLead && (
                        <Text style={styles.leadText} numberOfLines={1}>
                            Lead: {leadInfo.name || 'Unknown'}
                        </Text>
                    )}
                </View>

                {/* Speaking Indicator */}
                {isConnected && isSpeaking && (
                    <View style={styles.speakingIndicator}>
                        <Animated.View style={styles.speakingDot} />
                    </View>
                )}

                {/* Expand Icon */}
                {isConnected && (
                    <Feather
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#888"
                    />
                )}
            </TouchableOpacity>

            {/* Expanded Controls */}
            {expanded && isConnected && (
                <View style={styles.expandedControls}>
                    {isLead && (
                        <View style={styles.leadBadge}>
                            <Feather name="mic" size={14} color="#00C853" />
                            <Text style={styles.leadBadgeText}>You are the Lead</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={handleDisconnect}
                    >
                        <Feather name="log-out" size={16} color="#FF4444" />
                        <Text style={styles.controlButtonText}>Disconnect</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100, // Above tab bar
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    statusText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    leadText: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    speakingIndicator: {
        marginRight: 8,
    },
    speakingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#00C853',
        // Would add animation here for pulsing effect
    },
    expandedControls: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        marginTop: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    leadBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A3D1A',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        gap: 8,
    },
    leadBadgeText: {
        color: '#00C853',
        fontSize: 14,
        fontWeight: '600',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#2A2A2A',
        gap: 10,
    },
    controlButtonText: {
        color: '#FF4444',
        fontSize: 14,
        fontWeight: '500',
    },
});
