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
  const voiceRecorderRef = useRef(null);

  // Expose voice recorder methods globally for tab bar access
  useEffect(() => {
    if (global.voiceRecorderRef) {
      global.voiceRecorderRef = voiceRecorderRef;
    } else {
      global.voiceRecorderRef = voiceRecorderRef;
    }
  }, []);

  if (loading || !group) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <GroupHeader group={group} />
      <MessagesTab ref={messagesTabRef} group={group} />
    </View>
  );
}
