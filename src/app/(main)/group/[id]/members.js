import React from 'react';
import { View, Text} from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import GroupHeader from '@/src/components/groups/GroupHeader';
import UsersTab from '@/src/components/groups/UsersTab';
import { useGroupData } from '@/src/hooks/useGroupData';
import { globalStyles } from '@/src/styles/globalStyles';

export default function MembersTabScreen() {
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
      <UsersTab group={group} />
    </View>
  );
}