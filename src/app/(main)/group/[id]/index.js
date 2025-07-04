import React, { useEffect, useState, useRef } from 'react';
import { View, Text } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import GroupHeader from '@/src/components/groups/GroupHeader';
import MessagesTab from '@/src/components/groups/MessagesTab';
import VoiceRecorder from '@/src/components/groups/VoiceRecorder';
import { useGroupData } from '@/src/hooks/useGroupData';

export default function MessagesTabScreen() {
  const { id } = useGlobalSearchParams();
  const { group, loading } = useGroupData(id);
  const messagesTabRef = useRef(null);

  const handleSendAudio = (audioUri, duration) => {
    // This would typically send the audio to your backend
    console.log('Sending audio message:', audioUri, duration);
    
    // For now, we can add it to the messages in MessagesTab
    // You might want to lift the messages state up or use a context
    if (messagesTabRef.current && messagesTabRef.current.addNewAudioMessage) {
      messagesTabRef.current.addNewAudioMessage(audioUri, duration);
    }
  };

  if (loading || !group) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <GroupHeader group={group} />
      <MessagesTab ref={messagesTabRef} group={group} />
      <VoiceRecorder 
        group={group}
        onSendAudio={handleSendAudio}
      />
    </View>
  );
}
