
// src/screens/GroupListScreen.js
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GroupItem from '@/src/components/groups/GroupItem';
import SearchBar from '@/src/components/groups/SearchBar';
import FloatingActionButton from '@/src/components/groups/FloatingActionButton';
import CreateJoinGroupModal from '@/src/components/groups/CreateJoinGroupModal';
import { colors } from '@/src/constants/colors';
import UserService from '@/src/apis/userService';

const GroupListScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState([]);

  
  useFocusEffect(
    useCallback(() => {
      fetchUserGroups();
    }, [])
  );

  const fetchUserGroups = async () => {
    setIsLoading(true);
    try {
    
      const userGroups = await UserService.getCurrentUserGroups();
      if (userGroups.status !== 200) {
        Alert.alert('Error', 'Not able to fecth user groups');
      }else{
        console.log('userGroups.data', userGroups.data.groups);
        setGroups(userGroups.data.groups);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const filteredGroups = groups.filter(grp =>
    grp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupPress = (group) => {
    // Navigate to group details with the group ID
    router.push(`/(main)/group/${group.id}`);
  };

  const handleCreateGroup = (groupData) => {
    // Add new group to the list
    console.log('new group data:', groupData);
    const newGroup = {
      id: groupData?.id,
      name: groupData?.name,
      memberCount: groupData.memberCount,
      image: groupData.image,
    };
    setGroups([newGroup, ...groups]);
    setIsModalVisible(false);
  };

  const handleJoinGroup = (groupCode) => {
    // Handle join group logic
    console.log('Joining group with code:', groupCode);
    setIsModalVisible(false);
  };

  const renderGroupItem = ({ item }) => (
    <GroupItem
      group={item}
      onPress={() => handleGroupPress(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WayFind</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="more-vert" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search Groups"
      />

      {/* Groups Section */}
      <View style={styles.sectionHeader}>
        <Icon name="group" size={20} color={colors.textSecondary} />
        <Text style={styles.sectionTitle}>GROUPS & CHANNELS</Text>
      </View>

      {/* Groups List */}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.id}
        style={styles.groupsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.groupsListContent}
        // Empty state component
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptySubtitle}>
              Please join a group or create one to get started
            </Text>
          </View>
        )}


      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setIsModalVisible(true)}
      />

      {/* Create/Join Group Modal */}
      <CreateJoinGroupModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  moreButton: {
    padding: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  groupsList: {
    flex: 1,
  },
  groupsListContent: {
    paddingBottom: 100,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default GroupListScreen;
