import React from 'react';
import { View, Text } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import OrganizationHeader from '@/src/components/organizations/OrganizationHeader';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';
import { globalStyles } from '@/src/styles/globalStyles';

export default function MapTabScreen() {
  const { id } = useGlobalSearchParams();
  const { organization, loading } = useOrganizationData(id);

  if (loading || !organization) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <OrganizationHeader organization={organization} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Organization Map View (Coming Soon)</Text>
      </View>
    </View>
  );
}