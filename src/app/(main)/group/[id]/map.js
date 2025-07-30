import React from 'react';
import { View, Text } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import GroupHeader from '@/src/components/groups/GroupHeader';
import MapTab from '@/src/components/groups/MapTab';
import { useGroupData } from '@/src/hooks/useGroupData';
import { globalStyles } from '@/src/styles/globalStyles';

export default function MapTabScreen() {
  const { id } = useGlobalSearchParams();
  const { group, loading } = useGroupData(id);

  if (loading || !group) {
     return (
       <View style={globalStyles.loadingContainer}>
          <Text style={globalStyles.loadingText}>Loading...</Text>
        </View>
     );
  }

  return (
    <View style={{ flex: 1 }}>
      <GroupHeader group={group} />
      <MapTab group={group} />
    </View>
  );
}