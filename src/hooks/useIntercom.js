/**
 * useIntercom Hook - Manages LiveKit connection for Universal Intercom
 * 
 * Handles:
 * - LiveKit room connection
 * - Audio publishing (Lead only)
 * - Audio subscribing (all participants)
 * - Connection state management
 * - Auto-reconnection
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import IntercomService from '@/src/apis/intercomService';

// Note: These imports will work after installing @livekit/react-native
// For now, we'll create a mock structure that can be replaced

/**
 * Intercom connection states
 */
export const IntercomState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
};

/**
 * Custom hook for managing intercom connection
 * @param {string} rideId - The ride UUID
 * @param {boolean} enabled - Whether intercom should be active
 */
export function useIntercom(rideId, enabled = false) {
    const [state, setState] = useState(IntercomState.DISCONNECTED);
    const [isLead, setIsLead] = useState(false);
    const [leadInfo, setLeadInfo] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    const [livekitUrl, setLivekitUrl] = useState(null);

    // Refs for managing connection
    const roomRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    /**
     * Fetch token and connection details from backend
     */
    const fetchToken = useCallback(async () => {
        if (!rideId) return null;

        try {
            const response = await IntercomService.getIntercomToken(rideId);
            if (response.status === 'success') {
                setToken(response.token);
                setLivekitUrl(response.livekit_url);
                setIsLead(response.is_lead);
                setLeadInfo(response.lead_info);
                return response;
            }
            return null;
        } catch (err) {
            console.error('Failed to fetch intercom token:', err);
            setError(err.message || 'Failed to get intercom access');
            return null;
        }
    }, [rideId]);

    /**
     * Connect to the intercom room
     */
    const connect = useCallback(async () => {
        if (!rideId || !enabled) return;

        setState(IntercomState.CONNECTING);
        setError(null);

        try {
            // Fetch token
            const tokenData = await fetchToken();
            if (!tokenData) {
                setState(IntercomState.ERROR);
                return;
            }

            // TODO: Replace with actual LiveKit connection when package is installed
            // This is a placeholder showing the expected flow
            console.log('Intercom: Would connect to LiveKit with:', {
                url: tokenData.livekit_url,
                token: tokenData.token?.substring(0, 20) + '...',
                isLead: tokenData.is_lead,
            });

            /*
            // Actual LiveKit connection code (uncomment when @livekit/react-native is installed):
            
            import { Room, RoomEvent, Track, AudioSession } from '@livekit/react-native';
            
            // Configure audio session for background playback
            await AudioSession.configureAudio({
                android: {
                    audioTypeOptions: {
                        contentType: 'CONTENT_TYPE_SPEECH',
                        usage: 'USAGE_VOICE_COMMUNICATION',
                    },
                },
                ios: {
                    category: 'playAndRecord',
                    mode: 'voiceChat',
                    options: ['allowBluetooth', 'defaultToSpeaker', 'mixWithOthers'],
                },
            });

            const room = new Room();
            roomRef.current = room;

            // Set up event listeners
            room.on(RoomEvent.Connected, () => {
                setState(IntercomState.CONNECTED);
                console.log('Intercom: Connected to room');
            });

            room.on(RoomEvent.Disconnected, () => {
                setState(IntercomState.DISCONNECTED);
                console.log('Intercom: Disconnected from room');
            });

            room.on(RoomEvent.Reconnecting, () => {
                setState(IntercomState.RECONNECTING);
            });

            room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === Track.Kind.Audio) {
                    // Audio track from Lead received
                    setIsSpeaking(true);
                }
            });

            room.on(RoomEvent.TrackUnsubscribed, (track) => {
                if (track.kind === Track.Kind.Audio) {
                    setIsSpeaking(false);
                }
            });

            // Connect to room
            await room.connect(tokenData.livekit_url, tokenData.token, {});

            // If Lead, enable microphone automatically
            if (tokenData.is_lead) {
                await room.localParticipant.setMicrophoneEnabled(true, {
                    // Enable noise suppression for wind noise
                    noiseSuppression: true,
                    echoCancellation: true,
                    autoGainControl: true,
                });
                console.log('Intercom: Lead microphone enabled');
            }
            */

            // Simulate successful connection for now
            setState(IntercomState.CONNECTED);

        } catch (err) {
            console.error('Intercom connection error:', err);
            setError(err.message || 'Connection failed');
            setState(IntercomState.ERROR);
        }
    }, [rideId, enabled, fetchToken]);

    /**
     * Disconnect from the intercom room
     */
    const disconnect = useCallback(async () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (roomRef.current) {
            // await roomRef.current.disconnect();
            roomRef.current = null;
        }

        setState(IntercomState.DISCONNECTED);
        setIsSpeaking(false);
        console.log('Intercom: Disconnected');
    }, []);

    /**
     * Toggle microphone (Lead only)
     */
    const toggleMicrophone = useCallback(async (enable) => {
        if (!isLead || !roomRef.current) {
            console.log('Intercom: Cannot toggle mic - not Lead or not connected');
            return false;
        }

        try {
            // await roomRef.current.localParticipant.setMicrophoneEnabled(enable);
            console.log(`Intercom: Microphone ${enable ? 'enabled' : 'disabled'}`);
            return true;
        } catch (err) {
            console.error('Failed to toggle microphone:', err);
            return false;
        }
    }, [isLead]);

    /**
     * Refresh intercom status (who is Lead, etc.)
     */
    const refreshStatus = useCallback(async () => {
        if (!rideId) return null;

        try {
            const status = await IntercomService.getIntercomStatus(rideId);
            if (status.status === 'success') {
                setLeadInfo(status.lead);
                return status;
            }
            return null;
        } catch (err) {
            console.error('Failed to refresh intercom status:', err);
            return null;
        }
    }, [rideId]);

    // Auto-connect when enabled
    useEffect(() => {
        if (enabled && rideId) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [enabled, rideId, connect, disconnect]);

    return {
        // State
        state,
        isConnected: state === IntercomState.CONNECTED,
        isLead,
        leadInfo,
        isSpeaking,
        error,

        // Actions
        connect,
        disconnect,
        toggleMicrophone,
        refreshStatus,
        fetchToken,
    };
}

export default useIntercom;
