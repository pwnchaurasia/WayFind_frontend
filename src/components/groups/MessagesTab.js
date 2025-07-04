// src/components/MessagesTab.js
import React, { useState, useEffect } from 'react';
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
import { useAudioPlayer } from 'expo-audio';
import { colors } from '@/src/constants/colors';

const MessagesTab = ({ group }) => {
  const player = useAudioPlayer();
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'Hooman Abasi',
      senderId: '3',
      time: '06:40',
      type: 'audio',
      duration: '12min',
      durationMs: 720000, // 12 minutes in milliseconds
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
      duration: '12min',
      durationMs: 720000,
      playCount: 2,
      avatar: null,
      audioUri: null,
      isPlaying: false,
      currentPosition: 0,
    },
  ]);

  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  const generateInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colorOptions = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorOptions[Math.abs(hash) % colorOptions.length];
  };

  const formatDuration = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playAudio = async (message) => {
    try {
      if (currentPlayingId === message.id) {
        // If clicking the same message, just stop
        if (player.playing) {
          player.pause();
        }
        setCurrentPlayingId(null);
        updateMessagePlayState(message.id, false, 0);
        return;
      }

      // Stop current audio if playing
      if (player.playing) {
        player.pause();
      }

      // For demo purposes, we'll simulate playback since we don't have real audio files
      if (message.audioUri) {
        // If we have a real audio URI, we would use:
        // player.replace(message.audioUri);
        // player.play();
        
        setCurrentPlayingId(message.id);
        updateMessagePlayState(message.id, true, 0);
      } else {
        // Simulate audio playback for demo
        setCurrentPlayingId(message.id);
        updateMessagePlayState(message.id, true, 0);
        
        // Simulate progress
        const interval = setInterval(() => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === message.id && msg.isPlaying) {
              const newPosition = msg.currentPosition + 1000;
              if (newPosition >= msg.durationMs) {
                clearInterval(interval);
                setCurrentPlayingId(null);
                return { ...msg, isPlaying: false, currentPosition: 0 };
              }
              return { ...msg, currentPosition: newPosition };
            }
            return msg;
          }));
        }, 1000);

        // Auto stop after duration
        setTimeout(() => {
          clearInterval(interval);
          setCurrentPlayingId(null);
          updateMessagePlayState(message.id, false, 0);
        }, message.durationMs);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Could not play audio message');
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
            styles.waveformBar,
            { 
              height,
              backgroundColor: isActive ? colors.primary : colors.textSecondary,
            }
          ]} 
        />
      );
    });
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === 'current-user';
    
    return (
      <View style={styles.messageContainer}>
        <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: getInitialsColor(item.sender) }]}>
                  <Text style={styles.avatarText}>{generateInitials(item.sender)}</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={[styles.messageContent, isOwnMessage && styles.ownMessageContent]}>
            {!isOwnMessage && (
              <Text style={styles.senderName}>{item.sender}</Text>
            )}
            
            <View style={[styles.audioMessage, isOwnMessage && styles.ownAudioMessage]}>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => playAudio(item)}
              >
                <Ionicons 
                  name={item.isPlaying ? "pause" : "play"} 
                  size={16} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <View style={styles.waveform}>
                <View style={styles.waveformBars}>
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
            
            <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
              {item.time}
            </Text>
          </View>
          
          {isOwnMessage && (
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: getInitialsColor('You') }]}>
                <Text style={styles.avatarText}>YU</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100, // Space for voice recorder
  },
  dateHeader: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
    marginTop: 10,
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  ownMessageRow: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageContent: {
    maxWidth: '70%',
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    minWidth: 250,
  },
  ownAudioMessage: {
    backgroundColor: colors.primary + '20',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waveform: {
    flex: 1,
    marginRight: 12,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    justifyContent: 'space-between',
  },
  waveformBar: {
    width: 3,
    backgroundColor: colors.textSecondary,
    marginHorizontal: 0.5,
    borderRadius: 1.5,
  },
  duration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
    minWidth: 35,
  },
  playCount: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  playCountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ownMessageTime: {
    textAlign: 'right',
  },
});

export default MessagesTab;
