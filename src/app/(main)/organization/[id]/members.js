import React from 'react';
import { View, Text } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import OrganizationHeader from '@/src/components/organizations/OrganizationHeader';
import UsersTab from '@/src/components/organizations/UsersTab';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';
import { globalStyles } from '@/src/styles/globalStyles';

export default function MembersTabScreen() {
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
      <UsersTab organization={organization} />
    </View>
  );
}