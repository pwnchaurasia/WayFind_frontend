
// src/components/MessagesTab.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { colors } from '../constants/colors';

const MessagesTab = ({ group }) => {
  const [messages] = useState([
    {
      id: '1',
      sender: 'Hooman Abasi',
      time: '06:40',
      type: 'audio',
      duration: '12min',
      playCount: 2,
      avatar: null,
    },
    {
      id: '2',
      sender: 'You',
      time: '07:55',
      type: 'audio',
      duration: '12min',
      playCount: 2,
      avatar: null,
    },
  ]);

  const generateInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender === 'You';
    
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.dateHeader}>Today</Text>
        
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
            
            <View style={styles.audioMessage}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
              
              <View style={styles.waveform}>
                {/* Audio waveform visualization */}
                <View style={styles.waveformBars}>
                  {[...Array(20)].map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.waveformBar,
                        { height: Math.random() * 20 + 5 }
                      ]} 
                    />
                  ))}
                </View>
              </View>
              
              <Text style={styles.duration}>{item.duration}</Text>
              
              {item.playCount > 1 && (
                <View style={styles.playCount}>
                  <Text style={styles.playCountText}>x{item.playCount}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.messageTime}>{item.time}</Text>
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
    <FlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={item => item.id}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
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
    minWidth: 200,
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
  playIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 2,
  },
  waveform: {
    flex: 1,
    marginRight: 12,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  waveformBar: {
    width: 2,
    backgroundColor: colors.primary,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  duration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
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
});

export default MessagesTab;
