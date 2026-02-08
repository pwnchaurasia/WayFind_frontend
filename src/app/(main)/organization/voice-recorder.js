import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import OrganizationHeader from '@/src/components/organizations/OrganizationHeader';
import VoiceRecorder from '@/src/components/organizations/VoiceRecorder';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';

export default function VoiceRecorderScreen() {
  const { id } = useLocalSearchParams();
  const { organization, loading } = useOrganizationData(id);
  const router = useRouter();

  const handleSendAudio = (audioUri, duration) => {
    console.log('Sending audio message:', audioUri, duration);
    // Handle audio sending logic here
    // After sending, navigate back to messages
    router.push(`/(main)/organization/${id}`);
  };

  if (loading || !organization) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OrganizationHeader organization={organization} />
      <View style={styles.content}>
        <Text style={styles.title}>Voice Message</Text>
        <Text style={styles.subtitle}>Hold the button below to record your voice message</Text>
      </View>
      <VoiceRecorder
        organization={organization}
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
