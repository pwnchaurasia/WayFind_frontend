import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  AudioRecorder, 
  AudioPlayer, 
  useAudioRecorder, 
  useAudioPlayer,
  useAudioRecorderPermissions 
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { colors } from '@/src/constants/colors';

const VoiceRecorder = ({ onSendAudio, group }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionResponse, requestPermission] = useAudioRecorderPermissions();
  const recorder = useAudioRecorder();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const recordingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recorder.isRecording) {
        recorder.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, [recorder]);

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
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }

      console.log('Starting recording..');
      await recorder.record();
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recorder.isRecording) return;

    console.log('Stopping recording..');
    setIsRecording(false);
    
    try {
      const uri = await recorder.stop();
      
      console.log('Recording stopped and stored at', uri);
      
      // Get file info to check duration
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // Send the audio message (we'll estimate duration based on recording time)
      if (uri && recordingTime > 1) {
        await sendAudioMessage(uri, recordingTime * 1000); // Convert to milliseconds
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

      // Optional: Copy to a permanent location
      const fileName = `voice_message_${Date.now()}.m4a`;
      const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: audioUri,
        to: permanentUri,
      });

      console.log('Audio message sent:', permanentUri);
      
      // Here you would send to your backend
      // await sendAudioToServer(permanentUri, group.id);
      
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
    if (recorder.isRecording && isRecording) {
      console.log('Cancelling recording..');
      setIsRecording(false);
      
      try {
        await recorder.stop();
        console.log('Recording cancelled');
      } catch (error) {
        console.error('Error cancelling recording:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.recordingInfo}>
          <View style={styles.recordingHeader}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording</Text>
            </View>
            <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
              <Ionicons name="close" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
          <Text style={styles.hintText}>
            {Platform.OS === 'ios' ? 'Release to send' : 'Tap to stop and send'}
          </Text>
        </View>
      )}
      
      <Animated.View style={[styles.micButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.recordingButton]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={100}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={28} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </Animated.View>
      
      {isRecording && (
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(recordingTime / 30) * 100}%` }
            ]} 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  recordingInfo: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 4,
  },
  timerText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  micButtonContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF1744',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.error,
    borderRadius: 2,
  },
});

export default VoiceRecorder;
