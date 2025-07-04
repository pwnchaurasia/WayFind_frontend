import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import GroupHeader from '@/src/components/groups/GroupHeader';
import VoiceRecorder from '@/src/components/groups/VoiceRecorder';
import { useGroupData } from '@/src/hooks/useGroupData';

export default function VoiceRecorderScreen() {
  const { id } = useGlobalSearchParams();
  const { group, loading } = useGroupData(id);
  const router = useRouter();

  const handleSendAudio = (audioUri, duration) => {
    console.log('Sending audio message:', audioUri, duration);
    // Handle audio sending logic here
    // After sending, navigate back to messages
    router.push(`/group/${id}`);
  };

  if (loading || !group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GroupHeader group={group} />
      <View style={styles.content}>
        <Text style={styles.title}>Voice Message</Text>
        <Text style={styles.subtitle}>Hold the button below to record your voice message</Text>
      </View>
      <VoiceRecorder 
        group={group}
        onSendAudio={handleSendAudio}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});
