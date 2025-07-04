import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import GroupHeader from '@/src/components/groups/GroupHeader';
import UsersTab from '@/src/components/groups/UsersTab';
import { useGroupData } from '@/src/hooks/useGroupData';

export default function MembersTabScreen() {
  const { id } = useLocalSearchParams();
  const { group, loading } = useGroupData(id);

  if (loading || !group) return <View />; // Add loading state

  return (
    <View style={{ flex: 1 }}>
      <GroupHeader group={group} />
      <UsersTab group={group} />
    </View>
  );
}