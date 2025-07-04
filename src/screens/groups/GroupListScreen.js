
// src/screens/GroupListScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GroupItem from '@/src/components/groups/GroupItem';
import SearchBar from '@/src/components/groups/SearchBar';
import FloatingActionButton from '@/src/components/groups/FloatingActionButton';
import CreateJoinGroupModal from '@/src/components/groups/CreateJoinGroupModal';
import { colors } from '@/src/constants/colors';

const GroupListScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [groups, setGroups] = useState([
    {
      id: '1',
      name: 'Duxica Group',
      memberCount: 22,
      image: null,
    },
    {
      id: '2',
      name: 'Probo Team',
      memberCount: 22,
      image: null,
    },
    {
      id: '3',
      name: 'DOTX Team',
      memberCount: 22,
      image: null,
    },
  ]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupPress = (group) => {
    // Navigate to group details
    console.log('Group pressed:', group.name);
  };

  const handleCreateGroup = (groupData) => {
    // Add new group to the list
    const newGroup = {
      id: Date.now().toString(),
      name: groupData.name,
      memberCount: 1,
      image: groupData.image,
    };
    setGroups([...groups, newGroup]);
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
});

export default GroupListScreen;
