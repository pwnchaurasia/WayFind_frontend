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
import { Audio } from 'expo-audio';
import { globalStyles, formatTime } from '@/src/styles/globalStyles';
import { theme } from '@/src/styles/theme';

const VoiceRecorder = forwardRef(({ onSendAudio, group }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recording, setRecording] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const recordingTimeoutRef = useRef(null);

  useEffect(() => {
    // Request audio permissions on component mount
    requestPermissions();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      // Clean up recording if component unmounts
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const requestPermissions = async () => {
    // try {
    //   const { status } = await Audio.requestPermissionsAsync();
    //   if (status !== 'granted') {
    //     Alert.alert(
    //       'Permission Required',
    //       'Microphone permission is required to record audio messages.',
    //       [
    //         { text: 'Cancel', style: 'cancel' },
    //         { text: 'Settings', onPress: () => Audio.requestPermissionsAsync() }
    //       ]
    //     );
    //   }
    // } catch (error) {
    //   console.error('Error requesting audio permissions:', error);
    // }
  };

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
      console.log('Starting recording...');
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !recording) return;

    console.log('Stopping recording...');
    setIsRecording(false);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      console.log('Recording stopped and stored at', uri);
      
      // Get recording status to get duration
      const status = await recording.getStatusAsync();
      const duration = status.durationMillis || recordingTime * 1000;
      
      // Reset recording state
      setRecording(null);
      
      // Send the audio message
      if (recordingTime >= 1) {
        await sendAudioMessage(uri, duration);
      } else {
        Alert.alert('Recording too short', 'Please record for at least 1 second.');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to save recording.');
      setRecording(null);
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
    if (isRecording && recording) {
      console.log('Cancelling recording...');
      setIsRecording(false);
      
      try {
        await recording.stopAndUnloadAsync();
        setRecording(null);
        console.log('Recording cancelled');
      } catch (error) {
        console.error('Error cancelling recording:', error);
        setRecording(null);
      }
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
