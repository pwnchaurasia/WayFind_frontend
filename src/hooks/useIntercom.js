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
import { Platform } from 'react-native';
import {
    AudioSession,
    registerGlobals
} from '@livekit/react-native';
import { Room, RoomEvent } from 'livekit-client';
import IntercomService from '@/src/apis/intercomService';

// Ensure WebRTC globals are registered
registerGlobals();

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
    const [isSpeaking, setIsSpeaking] = useState(false); // If *Active Speaker* is speaking
    const [speakerName, setSpeakerName] = useState(null); // Name of current speaker

    // User controls
    const [isMuted, setIsMuted] = useState(true); // Default to muted

    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    const [livekitUrl, setLivekitUrl] = useState(null);

    // Refs for managing connection
    const roomRef = useRef(null);
    const requestRef = useRef(null);
    const stateRef = useRef(IntercomState.DISCONNECTED);

    // Sync state ref
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    /**
     * Fetch token and connection details from backend
     */
    const fetchToken = useCallback(async () => {
        if (!rideId) return null;

        try {
            const response = await IntercomService.getIntercomToken(rideId);
            console.log(response, "response")
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

        // Use ref to check current state without adding dependency
        const currentState = stateRef.current;
        if (currentState === IntercomState.CONNECTING || currentState === IntercomState.CONNECTED || currentState === IntercomState.ERROR) return;

        setState(IntercomState.CONNECTING);
        setError(null);

        try {
            // 1. Fetch token
            const tokenData = await fetchToken();
            if (!tokenData || !tokenData.token) {
                setState(IntercomState.ERROR);
                return;
            }

            // 2. Configure Audio Session
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

            // 3. Create Room and Connect
            let room;
            try {
                // Safety check for WebRTC globals
                // @livekit/react-native should polyfill these via registerGlobals()
                if (!global.WebSocket && !window?.WebSocket) {
                    console.error("UseIntercom: WebRTC globals missing!");
                    // Attempt to register again if missing
                    registerGlobals();
                }
                // Create room instance using livekit-client Room
                room = new Room();
            } catch (e) {
                console.error("UseIntercom: Failed to create Room instance", e);
                setError("Voice initialization failed - native module missing?");
                setState(IntercomState.ERROR);
                return; // Stop the connection attempt
            }

            roomRef.current = room;

            await room.connect(tokenData.livekit_url, tokenData.token, {
                autoSubscribe: true,
            });

            // 4. Set up Event Listeners
            _setupEventListeners(room);

            // 5. Initial State
            setState(IntercomState.CONNECTED);

            // If Lead, prepare microphone but start muted
            if (tokenData.is_lead) {
                // By default muted, user must tap to talk/open mic
                await room.localParticipant.setMicrophoneEnabled(false);
                setIsMuted(true);
            }

            console.log('Intercom: Connected successfully!');

        } catch (err) {
            console.error('Intercom connection error:', err);
            setError(err.message || 'Connection failed');
            setState(IntercomState.ERROR);
        }
    }, [rideId, enabled, fetchToken]);

    /**
     * Setup Room Event Listeners
     */
    const _setupEventListeners = (room) => {
        if (!room) return;

        room
            .on(RoomEvent.Connected, () => {
                setState(IntercomState.CONNECTED);
            })
            .on(RoomEvent.Disconnected, () => {
                setState(IntercomState.DISCONNECTED);
                setIsSpeaking(false);
                setSpeakerName(null);
            })
            .on(RoomEvent.Reconnecting, () => {
                setState(IntercomState.RECONNECTING);
            })
            .on(RoomEvent.Reconnected, () => {
                setState(IntercomState.CONNECTED);
            })
            .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                if (speakers.length > 0) {
                    setIsSpeaking(true);
                    // Use identity or name of first speaker
                    const speaker = speakers[0];
                    setSpeakerName(speaker.identity || 'Rider');
                } else {
                    setIsSpeaking(false);
                    setSpeakerName(null);
                }
            })
            .on(RoomEvent.LocalTrackPublished, (publication, participant) => {
                console.log('Local track published:', publication.kind);
            })
            .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                console.log('Track subscribed:', track.kind, 'from', participant.identity);
            });
    };

    /**
     * Disconnect from the intercom room
     */
    const disconnect = useCallback(async () => {
        if (roomRef.current) {
            await roomRef.current.disconnect();
            roomRef.current = null;
        }

        setState(IntercomState.DISCONNECTED);
        setIsSpeaking(false);
        setSpeakerName(null);
        console.log('Intercom: Disconnected');
    }, []);

    /**
     * Toggle Mute (Unmute to speak) - Only for LEADS
     */
    const toggleMute = useCallback(async () => {
        if (!isLead || !roomRef.current) {
            console.log('Intercom: Cannot toggle mic - not Lead or not connected');
            return false;
        }

        try {
            const newMutedState = !isMuted;
            await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
            setIsMuted(newMutedState);
            console.log(`Intercom: Microphone ${newMutedState ? 'MUTED' : 'UNMUTED'}`);
            return true;
        } catch (err) {
            console.error('Failed to toggle microphone:', err);
            return false;
        }
    }, [isLead, isMuted]);

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
    }, [enabled, rideId, connect]);

    return {
        // State
        state,
        isConnected: state === IntercomState.CONNECTED,
        isLead,
        leadInfo,
        isSpeaking, // Is someone speaking?
        speakerName, // Who is speaking?
        isMuted, // Am I muted?
        error,

        // Actions
        connect,
        disconnect,
        toggleMute, // Function to toggle mute status
        fetchToken,
    };
}

export default useIntercom;
