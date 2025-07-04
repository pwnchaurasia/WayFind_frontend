import React from 'react';
import { router } from 'expo-router';
import GroupListScreen from '@/src/screens/groups/GroupListScreen';

export default function MainIndex() {
  const handleGroupPress = (group) => {
    router.push(`/group/${group.id}`);
  };

  return <GroupListScreen onGroupPress={handleGroupPress} />;
}