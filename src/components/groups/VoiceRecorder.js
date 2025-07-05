import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, formatTime } from '@/src/styles/globalStyles';
import { theme } from '@/src/styles/theme';

const VoiceRecorder = forwardRef(({ onSendAudio, group }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const recordingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto stop after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      setRecordingTime(0);
    }
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording simulation..');
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    
    try {
      // Simulate audio recording
      const simulatedUri = `file://simulated_audio_${Date.now()}.m4a`;
      
      console.log('Recording stopped and stored at', simulatedUri);
      
      // Send the audio message (we'll estimate duration based on recording time)
      if (recordingTime > 1) {
        await sendAudioMessage(simulatedUri, recordingTime * 1000); // Convert to milliseconds
      } else {
        Alert.alert('Recording too short', 'Please record for at least 1 second.');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to save recording.');
    }
  };

  const sendAudioMessage = async (audioUri, duration) => {
    try {
      // Here you would typically upload the audio to your server
      // For now, we'll just call the callback with the local URI
      
      if (onSendAudio) {
        onSendAudio(audioUri, duration);
      }

      console.log('Audio message sent:', audioUri);
      
      // Here you would send to your backend
      // await sendAudioToServer(audioUri, group.id);
      
    } catch (error) {
      console.error('Error sending audio message:', error);
      Alert.alert('Error', 'Failed to send audio message.');
    }
  };

  const handleLongPress = () => {
    if (!isRecording) {
      startRecording();
    }
  };

  const handlePressOut = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  const handlePress = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const cancelRecording = async () => {
    if (isRecording) {
      console.log('Cancelling recording..');
      setIsRecording(false);
      console.log('Recording cancelled');
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
  }));

  return (
    <View style={[
      globalStyles.voiceRecorderContainer,
      Platform.OS === 'android' && globalStyles.voiceRecorderContainerAndroid
    ]}>
      {isRecording && (
        <View style={globalStyles.recordingInfo}>
          <View style={globalStyles.recordingHeader}>
            <View style={globalStyles.recordingIndicator}>
              <View style={globalStyles.recordingDot} />
              <Text style={globalStyles.recordingText}>Recording</Text>
            </View>
            <TouchableOpacity onPress={cancelRecording} style={globalStyles.cancelButton}>
              <Ionicons name="close" size={theme.fontSize.lg} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
          
          <Text style={globalStyles.timerText}>{formatTime(recordingTime)}</Text>
          <Text style={globalStyles.hintText}>
            {Platform.OS === 'ios' ? 'Release to send' : 'Tap to stop and send'}
          </Text>
        </View>
      )}
      
      <Animated.View style={[globalStyles.micButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[globalStyles.micButton, isRecording && globalStyles.recordingButton]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={100}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={theme.fontSize.huge} 
            color={theme.colors.textPrimary} 
          />
        </TouchableOpacity>
      </Animated.View>
      
      {isRecording && (
        <View style={globalStyles.progressBar}>
          <View 
            style={[
              globalStyles.progressFill, 
              { width: `${(recordingTime / 30) * 100}%` }
            ]} 
          />
        </View>
      )}
    </View>
  );
});

export default VoiceRecorder;
