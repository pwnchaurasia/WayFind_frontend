// src/components/MessagesTab.js
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { globalStyles, getAvatarColor, generateInitials, formatDuration } from '@/src/styles/globalStyles';
import { theme } from '@/src/styles/theme';

const MessagesTab = forwardRef(({ group }, ref) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'Hooman Abasi',
      senderId: '3',
      time: '06:40',
      type: 'audio',
      duration: '0:05',
      durationMs: 5000, // 5 seconds for demo
      playCount: 2,
      avatar: null,
      audioUri: null, // Will be set when recording
      isPlaying: false,
      currentPosition: 0,
    },
    {
      id: '2',
      sender: 'You',
      senderId: 'current-user',
      time: '07:55',
      type: 'audio',
      duration: '0:08',
      durationMs: 8000, // 8 seconds for demo
      playCount: 2,
      avatar: null,
      audioUri: null,
      isPlaying: false,
      currentPosition: 0,
    },
  ]);

  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [sound, setSound] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState(null);

  useEffect(() => {
    return () => {
      // Clean up sound when component unmounts
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);


  const playAudio = async (message) => {
    try {
      // Stop current playing audio if any
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (currentPlayingId === message.id) {
        // If clicking the same message, just stop
        setCurrentPlayingId(null);
        updateMessagePlayState(message.id, false, 0);
        return;
      }

      // If no audioUri, simulate playback for demo messages
      if (!message.audioUri) {
        // Simulate audio playback for demo
        setCurrentPlayingId(message.id);
        updateMessagePlayState(message.id, true, 0);
        
        // Simulate progress
        const interval = setInterval(() => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === message.id && msg.isPlaying) {
              const newPosition = msg.currentPosition + 100;
              if (newPosition >= msg.durationMs) {
                clearInterval(interval);
                setCurrentPlayingId(null);
                return { ...msg, isPlaying: false, currentPosition: 0 };
              }
              return { ...msg, currentPosition: newPosition };
            }
            return msg;
          }));
        }, 100);

        // Auto stop after duration
        setTimeout(() => {
          clearInterval(interval);
          setCurrentPlayingId(null);
          updateMessagePlayState(message.id, false, 0);
        }, message.durationMs);
        return;
      }

      // Play real audio
      console.log('Loading audio from:', message.audioUri);
      
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: message.audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentPlayingId(message.id);
      updateMessagePlayState(message.id, true, 0);

      console.log('Playing audio');
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Could not play audio message');
      setCurrentPlayingId(null);
      updateMessagePlayState(message.id, false, 0);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    setPlaybackStatus(status);
    
    if (status.isLoaded && currentPlayingId) {
      const position = status.positionMillis || 0;
      const duration = status.durationMillis || 0;
      
      // Update message progress
      setMessages(prev => prev.map(msg => 
        msg.id === currentPlayingId 
          ? { ...msg, currentPosition: position, durationMs: duration }
          : msg
      ));

      // Handle playback completion
      if (status.didJustFinish) {
        setCurrentPlayingId(null);
        updateMessagePlayState(currentPlayingId, false, 0);
        if (sound) {
          sound.unloadAsync();
          setSound(null);
        }
      }
    }
  };

  const updateMessagePlayState = (messageId, isPlaying, position) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isPlaying, currentPosition: position }
        : { ...msg, isPlaying: false }
    ));
  };

  const addNewAudioMessage = (audioUri, duration) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: 'You',
      senderId: 'current-user',
      time: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      type: 'audio',
      duration: formatDuration(duration),
      durationMs: duration,
      playCount: 0,
      avatar: null,
      audioUri,
      isPlaying: false,
      currentPosition: 0,
    };

    setMessages(prev => [...prev, newMessage]);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addNewAudioMessage,
  }));

  const generateWaveform = (message) => {
    const bars = 25;
    const progress = message.durationMs > 0 ? message.currentPosition / message.durationMs : 0;
    
    return Array.from({ length: bars }, (_, index) => {
      const height = Math.random() * 20 + 5;
      const isActive = index < (progress * bars);
      
      return (
        <View 
          key={index} 
          style={[
            globalStyles.waveformBar,
            { 
              height,
              backgroundColor: isActive ? theme.colors.primary : theme.colors.textSecondary,
            }
          ]} 
        />
      );
    });
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === 'current-user';
    
    return (
      <View style={globalStyles.messageContainer}>
        <View style={[globalStyles.messageRow, isOwnMessage && globalStyles.ownMessageRow]}>
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={globalStyles.avatar} />
              ) : (
                <View style={[globalStyles.avatar, globalStyles.avatarPlaceholder, { backgroundColor: getAvatarColor(item.sender) }]}>
                  <Text style={[globalStyles.avatarText, globalStyles.avatarTextMedium]}>{generateInitials(item.sender)}</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={[globalStyles.messageContent, isOwnMessage && globalStyles.ownMessageContent]}>
            {!isOwnMessage && (
              <Text style={globalStyles.senderName}>{item.sender}</Text>
            )}
            
            <View style={[globalStyles.audioMessage, isOwnMessage && globalStyles.ownAudioMessage]}>
              <TouchableOpacity 
                style={globalStyles.playButton}
                onPress={() => playAudio(item)}
              >
                <Ionicons 
                  name={item.isPlaying ? "pause" : "play"} 
                  size={16} 
                  color={theme.colors.textPrimary} 
                />
              </TouchableOpacity>
              
              <View style={globalStyles.waveform}>
                <View style={globalStyles.waveformBars}>
                  {generateWaveform(item)}
                </View>
              </View>
              
              <Text style={styles.duration}>
                {item.isPlaying 
                  ? formatDuration(item.currentPosition) 
                  : item.duration
                }
              </Text>
              
              {item.playCount > 1 && (
                <View style={styles.playCount}>
                  <Text style={styles.playCountText}>x{item.playCount}</Text>
                </View>
              )}
            </View>
            
            <Text style={[globalStyles.messageTime, isOwnMessage && globalStyles.ownMessageTime]}>
              {item.time}
            </Text>
          </View>
          
          {isOwnMessage && (
            <View style={styles.avatarContainer}>
              <View style={[globalStyles.avatar, globalStyles.avatarPlaceholder, { backgroundColor: getAvatarColor('You') }]}>
                <Text style={[globalStyles.avatarText, globalStyles.avatarTextMedium]}>YU</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <Text style={styles.dateHeader}>Today</Text>
        )}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100, // Space for voice recorder
  },
  dateHeader: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  avatarContainer: {
    marginHorizontal: theme.spacing.sm,
  },
  duration: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
    minWidth: 35,
  },
  playCount: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  playCountText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.bold,
  },
});

export default MessagesTab;
