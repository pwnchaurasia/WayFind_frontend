import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import GroupDetailScreen from '@/src/screens/groups/GroupDetailScreen';

export default function GroupDetail() {
  const { id } = useLocalSearchParams();
  
  // You can fetch group data based on id here
  const group = {
    id,
    name: 'Group Name',
    memberCount: 22,
    onlineCount: 12,
    // ... other group data
  };

  const handleBack = () => {
    router.back();
  };

  return <GroupDetailScreen group={group} onBack={handleBack} />;
}