// src/components/UsersTab.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import SearchBar from './SearchBar';
import { colors } from '@/src/constants/colors';
import GroupService from '@/src/apis/groupService';
import { useGlobalSearchParams, useRouter } from 'expo-router';

const UsersTab = ({ group, isAdmin = false }) => {
  const { id } = useGlobalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  
  useEffect(() => {
    fetchGroupMembers();
  }, [group.id]);

  const fetchGroupMembers = async () => {
    try {
      setLoading(true);

      const response = await GroupService.getGroupUsers(id)
      console.log("Fetched group user", response)
      if(!response || !response.users) {
        throw new Error('No members found');
      }
      const membersData = response?.users || []; 
      setMembers(membersData);
      
    } catch (error) {
      console.error('Error fetching group members:', error);
      Alert.alert('Error', 'Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupMembers();
    setRefreshing(false);
  };

  const filteredMembers = members.filter(member =>
    member?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member?.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('Filtered Members:', filteredMembers);

  const generateInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colorOptions = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorOptions[Math.abs(hash) % colorOptions.length];
  };

  const getTimeSince = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return colors.error;
      case 'moderator': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return 'shield';
      case 'moderator': return 'star';
      default: return 'person';
    }
  };

  const handleUserPress = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleMicPress = (user) => {
    // Handle voice call or push-to-talk functionality
    Alert.alert(
      'Voice Call',
      `Start voice call with ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => initiateVoiceCall(user) }
      ]
    );
  };

  const initiateVoiceCall = (user) => {
    // Implement voice call functionality
    console.log('Starting voice call with:', user.name);
    // You can integrate with WebRTC, Agora, or similar service
  };

  const generateInviteLink = async () => {
    try {
      // Replace with your actual API endpoint
      const your_auth_token = 'your_auth_token_here'; // Replace with your auth token
      const response = await fetch(`https://your-api.com/groups/${group.id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${your_auth_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.inviteLink);
      } else {
        // Fallback for development
        const mockLink = `https://yourapp.com/join/${group.id}/${Date.now()}`;
        setInviteLink(mockLink);
      }
    } catch (error) {
      console.error('Error generating invite link:', error);
      const mockLink = `https://yourapp.com/join/${group.id}/${Date.now()}`;
      setInviteLink(mockLink);
    }
  };

  const handleInvitePress = () => {
    setShowInviteModal(true);
    // generateInviteLink();
  };

  const copyInviteLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    Alert.alert('Success', 'Invite link copied to clipboard!');
  };

  const shareInviteLink = () => {
    // You can use expo-sharing or react-native share
    Alert.alert(
      'Share Invite Link',
      'Copy the link to share via WhatsApp, SMS, or any messaging app.',
      [
        { text: 'Copy Link', onPress: copyInviteLink },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleRemoveUser = async (user) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to remove ${user.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeUserFromGroup(user)
        }
      ]
    );
  };

  const removeUserFromGroup = async (user) => {
    try {
      // Replace with your actual API endpoint
      const your_auth_token = 'your_auth_token_here'; // Replace with your auth token
      const response = await fetch(`https://your-api.com/groups/${group.id}/members/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${your_auth_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setMembers(prev => prev.filter(member => member.id !== user.id));
        setShowUserModal(false);
        Alert.alert('Success', `${user.name} has been removed from the group.`);
      } else {
        Alert.alert('Error', 'Failed to remove user from group.');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      Alert.alert('Error', 'Failed to remove user from group.');
    }
  };

  const handleMakeAdmin = async (user) => {
    Alert.alert(
      'Make Admin',
      `Make ${user.name} an admin of this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Make Admin', 
          onPress: () => changeUserRole(user, 'admin')
        }
      ]
    );
  };

  const changeUserRole = async (user, newRole) => {
    try {
      // Replace with your actual API endpoint
      const your_auth_token = 'your_auth_token_here'; // Replace with your auth token
      const response = await fetch(`https://your-api.com/groups/${group.id}/members/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${your_auth_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMembers(prev => prev.map(member => 
          member.id === user.id ? { ...member, role: newRole } : member
        ));
        setShowUserModal(false);
        Alert.alert('Success', `${user.name} is now ${newRole === 'admin' ? 'an admin' : 'a ' + newRole}.`);
      } else {
        Alert.alert('Error', 'Failed to change user role.');
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      Alert.alert('Error', 'Failed to change user role.');
    }
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.memberItem}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.memberInfo}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.memberAvatar} />
        ) : (
          <View style={[
            styles.memberAvatarPlaceholder, 
            { backgroundColor: getInitialsColor(item.name) }
          ]}>
            <Text style={styles.memberAvatarText}>
              {generateInitials(item.name)}
            </Text>
          </View>
        )}
        
        <View style={styles.memberDetails}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName}>{item.name}</Text>
            {item.isCurrentUser && (
              <Text style={styles.youLabel}>(You)</Text>
            )}
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          
          <Text style={styles.memberPhone}>{item?.phone_number}</Text>
          {/* <Text style={styles.memberEmail}>{item?.email}</Text> */}
          
          <View style={styles.memberMeta}>
            <View style={styles.roleContainer}>
              <Ionicons 
                name={getRoleIcon(item?.role)} 
                size={12} 
                color={getRoleColor(item?.role)} 
              />
              <Text style={[styles.roleText, { color: getRoleColor(item?.role) }]}>
                {item?.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
            
            <Text style={styles.lastSeenText}>
              {item.isOnline ? 'Online' : `Last seen ${getTimeSince(item.last_seen)}`}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.micButton}
        onPress={() => handleMicPress(item)}
      >
        <Ionicons name="mic" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{members.length}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{members.filter(m => m.isOnline).length}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{members.filter(m => m.role === 'admin').length}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
      </View>
      
      {isAdmin && (
        <TouchableOpacity 
          style={styles.inviteButton}
          onPress={handleInvitePress}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.inviteButtonText}>Invite Members</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search members..."
      />
      
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
        keyExtractor={item => item.id}
        style={styles.membersList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        )}
      />

      {/* User Detail Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Details</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalContent}>
                <View style={styles.userProfileSection}>
                  {selectedUser.image ? (
                    <Image source={{ uri: selectedUser.image }} style={styles.modalAvatar} />
                  ) : (
                    <View style={[
                      styles.modalAvatarPlaceholder, 
                      { backgroundColor: getInitialsColor(selectedUser.name) }
                    ]}>
                      <Text style={styles.modalAvatarText}>
                        {generateInitials(selectedUser.name)}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <Text style={styles.modalUserRole}>
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Text>
                </View>

                <View style={styles.userInfoSection}>
                  <View style={styles.infoItem}>
                    <Ionicons name="call" size={20} color={colors.textSecondary} />
                    <Text style={styles.infoText}>{selectedUser.phone_number}</Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="mail" size={20} color={colors.textSecondary} />
                    <Text style={styles.infoText}>{selectedUser.email}</Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                    <Text style={styles.infoText}>
                      Joined {new Date(selectedUser.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons 
                      name={selectedUser.isOnline ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedUser.isOnline ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={styles.infoText}>
                      {selectedUser.isOnline ? 'Online' : `Last seen ${getTimeSince(selectedUser.last_seen)}`}
                    </Text>
                  </View>
                </View>

                {/* Admin Actions */}
                {isAdmin && !selectedUser.isCurrentUser && (
                  <View style={styles.adminActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleMicPress(selectedUser)}
                    >
                      <Ionicons name="call" size={20} color={colors.primary} />
                      <Text style={styles.actionButtonText}>Voice Call</Text>
                    </TouchableOpacity>
                    
                    {selectedUser.role !== 'admin' && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleMakeAdmin(selectedUser)}
                      >
                        <Ionicons name="shield" size={20} color={colors.warning} />
                        <Text style={styles.actionButtonText}>Make Admin</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.dangerButton]}
                      onPress={() => handleRemoveUser(selectedUser)}
                    >
                      <Ionicons name="person-remove" size={20} color={colors.error} />
                      <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.inviteModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Members</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inviteDescription}>
                Share this link to invite new members to {group.name}
              </Text>
              
              <View style={styles.linkContainer}>
                <TextInput
                  style={styles.linkInput}
                  value={inviteLink}
                  editable={false}
                  multiline
                />
                <TouchableOpacity style={styles.copyButton} onPress={copyInviteLink}>
                  <Ionicons name="copy" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.shareButton} onPress={shareInviteLink}>
                <Ionicons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textPrimary,
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberDetails: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 8,
  },
  youLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  memberPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  lastSeenText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  micButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  userModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  inviteModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalContent: {
    padding: 20,
  },
  userProfileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalUserRole: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userInfoSection: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  adminActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    minWidth: '48%',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: colors.error + '20',
  },
  dangerButtonText: {
    color: colors.error,
  },
  inviteDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  linkInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: 12,
  },
  copyButton: {
    padding: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UsersTab;