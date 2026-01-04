import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import OrganizationService from '@/src/apis/organizationService';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function MembersTabScreen() {
  const { id } = useGlobalSearchParams();
  const { organization } = useOrganizationData(id);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Permission data from API
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchMembers = async () => {
    try {
      const response = await OrganizationService.getMembers(id);
      setMembers(response?.members || []);
      setCurrentUserRole(response?.current_user_role || null);
      setIsSuperAdmin(response?.is_super_admin || false);
      setIsAdmin(response?.is_admin || false);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMembers();
    }
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  // Role hierarchy for permission checks
  const roleHierarchy = { founder: 3, co_founder: 2, admin: 1 };

  const canManageMember = (targetRole) => {
    if (isSuperAdmin) return true;
    if (!currentUserRole) return false;
    const myLevel = roleHierarchy[currentUserRole] || 0;
    const targetLevel = roleHierarchy[targetRole] || 0;
    return myLevel > targetLevel;
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      founder: { bg: '#00C853', text: 'Founder' },
      co_founder: { bg: '#2196F3', text: 'Co-Founder' },
      admin: { bg: '#FF9800', text: 'Admin' },
    };
    return roleStyles[role] || { bg: '#666', text: 'Member' };
  };

  const generateInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colors = ['#7B68EE', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return '#00C853';
    if (rate >= 50) return '#FF9800';
    return '#F44336';
  };

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let sorted = [...members].sort((a, b) => {
      const rolePriority = { founder: 0, co_founder: 1, admin: 2 };
      const aPriority = rolePriority[a.role] ?? 99;
      const bPriority = rolePriority[b.role] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (a.name || '').localeCompare(b.name || '');
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      sorted = sorted.filter(m =>
        (m.name || '').toLowerCase().includes(query) ||
        (m.phone_number || '').includes(query) ||
        (m.email || '').toLowerCase().includes(query)
      );
    }

    return sorted;
  }, [members, searchQuery]);

  // Handle toggle member status
  const handleToggleStatus = async () => {
    if (!selectedMember) return;

    setToggleLoading(true);
    try {
      const response = await OrganizationService.toggleMemberStatus(id, selectedMember.id);
      if (response.status === 'success') {
        Alert.alert('Success', response.message);
        setModalVisible(false);
        setSelectedMember(null);
        fetchMembers();
      } else {
        Alert.alert('Error', response.message || 'Failed to toggle status');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to toggle status');
    } finally {
      setToggleLoading(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${selectedMember.name} from the organization?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoveLoading(true);
            try {
              const response = await OrganizationService.removeMember(id, selectedMember.id);
              if (response.status === 'success') {
                Alert.alert('Success', response.message);
                setModalVisible(false);
                setSelectedMember(null);
                fetchMembers();
              } else {
                Alert.alert('Error', response.message || 'Failed to remove member');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            } finally {
              setRemoveLoading(false);
            }
          }
        }
      ]
    );
  };

  // Open member profile modal
  const openMemberModal = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const renderMemberItem = ({ item }) => {
    const roleInfo = getRoleBadge(item.role);
    const name = item.name || 'Unknown';
    const attendanceRate = item.attendance_rate || 0;

    return (
      <TouchableOpacity style={styles.memberCard} onPress={() => openMemberModal(item)}>
        <View style={[styles.avatar, { backgroundColor: getInitialsColor(name) }]}>
          <Text style={styles.avatarText}>{generateInitials(name)}</Text>
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName} numberOfLines={1}>{name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
              <Text style={styles.roleText}>{roleInfo.text}</Text>
            </View>
            {!item.is_active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            {item.email && (
              <View style={styles.infoRow}>
                <Feather name="mail" size={11} color="#666" />
                <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
              </View>
            )}
          </View>

          {/* Attendance Progress */}
          <View style={styles.attendanceContainer}>
            <View style={styles.attendanceHeader}>
              <Feather name="check-circle" size={12} color="#888" />
              <Text style={styles.attendanceLabel}>Attendance</Text>
              <Text style={[styles.attendanceValue, { color: getAttendanceColor(attendanceRate) }]}>
                {attendanceRate}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(attendanceRate, 100)}%`,
                    backgroundColor: getAttendanceColor(attendanceRate)
                  }
                ]}
              />
            </View>
          </View>
        </View>

        <Feather name="chevron-right" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  // Member Profile Modal
  const renderMemberModal = () => {
    if (!selectedMember) return null;

    const roleInfo = getRoleBadge(selectedMember.role);
    const canManage = canManageMember(selectedMember.role);

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Profile</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={[styles.modalAvatar, { backgroundColor: getInitialsColor(selectedMember.name) }]}>
                <Text style={styles.modalAvatarText}>{generateInitials(selectedMember.name)}</Text>
              </View>
              <Text style={styles.profileName}>{selectedMember.name || 'Unknown'}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
                  <Text style={styles.roleText}>{roleInfo.text}</Text>
                </View>
                {!selectedMember.is_active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Inactive</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Details Section */}
            <View style={styles.detailsSection}>
              {selectedMember.email && (
                <View style={styles.detailRow}>
                  <Feather name="mail" size={16} color="#888" />
                  <Text style={styles.detailText}>{selectedMember.email}</Text>
                </View>
              )}
              {selectedMember.phone_number && (
                <View style={styles.detailRow}>
                  <Feather name="phone" size={16} color="#888" />
                  <Text style={styles.detailText}>{selectedMember.phone_number}</Text>
                </View>
              )}
              {selectedMember.created_at && (
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={16} color="#888" />
                  <Text style={styles.detailText}>
                    Joined {new Date(selectedMember.created_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Attendance Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.statsSectionTitle}>Attendance Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{selectedMember.total_rides_registered || 0}</Text>
                  <Text style={styles.statLabel}>Rides Registered</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{selectedMember.total_rides_attended || 0}</Text>
                  <Text style={styles.statLabel}>Rides Attended</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: getAttendanceColor(selectedMember.attendance_rate || 0) }]}>
                    {selectedMember.attendance_rate || 0}%
                  </Text>
                  <Text style={styles.statLabel}>Attendance Rate</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons (only for admins who can manage this member) */}
            {canManage && (
              <View style={styles.actionsSection}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.toggleButton]}
                  onPress={handleToggleStatus}
                  disabled={toggleLoading || removeLoading}
                >
                  {toggleLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather
                        name={selectedMember.is_active ? "user-x" : "user-check"}
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.actionButtonText}>
                        {selectedMember.is_active ? 'Deactivate' : 'Activate'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={handleRemoveMember}
                  disabled={toggleLoading || removeLoading}
                >
                  {removeLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="trash-2" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Remove</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{organization?.name || 'Organization'}</Text>
        <Text style={styles.subtitle}>{members.length} Members</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Feather name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Members List */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id || item.user_id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C853" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color="#666" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No members match your search' : 'No members found'}
            </Text>
          </View>
        }
      />

      {/* Member Profile Modal */}
      {renderMemberModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors?.background || '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors?.background || '#121212',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: '#fff',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    maxWidth: 140,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#555',
  },
  inactiveText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#aaa',
  },
  statsRow: {
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  attendanceContainer: {
    marginTop: 4,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 11,
    color: '#888',
    flex: 1,
  },
  attendanceValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsSection: {
    padding: 20,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#ccc',
  },
  statsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#FF9800',
  },
  removeButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});