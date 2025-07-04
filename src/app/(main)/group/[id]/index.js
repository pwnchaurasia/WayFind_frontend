import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import GroupHeader from '@/src/components/groups/GroupHeader';
import MessagesTab from '@/src/components/groups/MessagesTab';
import VoiceRecorder from '@/src/components/groups/VoiceRecorder';
import { useGroupData } from '@/src/hooks/useGroupData';

export default function MessagesTabScreen() {
  const { id } = useLocalSearchParams();
  const { group, loading } = useGroupData(id);
  const [isRecording, setIsRecording] = useState(false);

  if (loading || !group) return <View />; // Add loading state

  return (
    <View style={{ flex: 1 }}>
      <GroupHeader group={group} />
      <MessagesTab group={group} />
      <VoiceRecorder 
        isRecording={isRecording}
        onStartRecording={() => setIsRecording(true)}
        onStopRecording={() => setIsRecording(false)}
      />
    </View>
  );
}