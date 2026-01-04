import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { useGlobalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import OrganizationService from '@/src/apis/organizationService';

const TABS = {
  MEMBERS: 'members',
  PARTICIPANTS: 'participants'
};

export default function MembersScreen() {
  const { id } = useGlobalSearchParams();

  const [activeTab, setActiveTab] = useState(TABS.MEMBERS);
  const [members, setMembers] = useState([]);
  const [rideParticipants, setRideParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    if (id) fetchAllPeople();
  }, [id]);

  const fetchAllPeople = async () => {
    try {
      setLoading(true);
      const response = await OrganizationService.getAllPeople(id);

      if (response.status === 'success') {
        setMembers(response.org_members || []);
        setRideParticipants(response.ride_participants || []);
        setUserRole(response.user_role);
        setOrganization(response.organization);
      } else {
        Alert.alert('Error', response.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error fetching people:', error);
      Alert.alert('Error', 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === TABS.MEMBERS ? members : rideParticipants;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const query = searchQuery.toLowerCase();
    return currentList.filter(person =>
      person.name?.toLowerCase().includes(query) ||
      person.phone?.toLowerCase().includes(query) ||
      person.email?.toLowerCase().includes(query)
    );
  }, [currentList, searchQuery]);

  const getRoleBadge = (role) => {
    const roles = {
      'founder': { label: 'Founder', color: '#FFD700', bg: '#3D3500' },
      'co_founder': { label: 'Co-Founder', color: '#C0C0C0', bg: '#2D2D2D' },
      'admin': { label: 'Admin', color: '#00C853', bg: '#003D19' },
      'member': { label: 'Member', color: '#2196F3', bg: '#0D2E4D' }
    };
    return roles[role?.toLowerCase()] || { label: role || 'Member', color: '#888', bg: '#2A2A2A' };
  };

  const generateInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const isAdmin = ['founder', 'co_founder', 'admin'].includes(userRole?.toLowerCase());

  const handleToggleStatus = async (personId) => {
    if (!isAdmin) return;
    setActionLoading(true);
    try {
      await OrganizationService.toggleMemberStatus(id, personId);
      fetchAllPeople();
      setSelectedPerson(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePerson = async (personId) => {
    if (!isAdmin) return;
    Alert.alert(
      'Remove Person',
      'Are you sure you want to remove this person from the organization?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await OrganizationService.removeMember(id, personId);
              fetchAllPeople();
              setSelectedPerson(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove person');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return '#00C853';
    if (rate >= 50) return '#FFB300';
    return '#FF5252';
  };

  const renderPerson = ({ item }) => {
    const roleBadge = getRoleBadge(item.role);
    const isOrgMember = activeTab === TABS.MEMBERS;
    const attendance = item.attendance || { total_rides: 0, attended: 0, attendance_rate: 0 };

    return (
      <TouchableOpacity
        style={[styles.personCard, !item.is_active && styles.inactiveCard]}
        onPress={() => setSelectedPerson(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
          <Text style={styles.avatarText}>{generateInitials(item.name)}</Text>
        </View>

        <View style={styles.personInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.personName} numberOfLines={1}>{item.name}</Text>
            {!item.is_active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactive</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {isOrgMember && item.role && (
              <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                <Text style={[styles.roleText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
              </View>
            )}
            {!isOrgMember && (
              <View style={styles.participantBadge}>
                <MaterialCommunityIcons name="motorbike" size={12} color="#888" />
                <Text style={styles.participantText}>Participant</Text>
              </View>
            )}

            {attendance.total_rides > 0 && (
              <View style={styles.attendanceIndicator}>
                <Text style={[styles.attendanceText, { color: getAttendanceColor(attendance.attendance_rate) }]}>
                  {attendance.attended}/{attendance.total_rides}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Feather name="chevron-right" size={20} color="#555" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather
        name={activeTab === TABS.MEMBERS ? "users" : "user-plus"}
        size={48}
        color="#444"
      />
      <Text style={styles.emptyTitle}>
        {activeTab === TABS.MEMBERS ? 'No Members Yet' : 'No Ride Participants'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === TABS.MEMBERS
          ? 'Organization members will appear here'
          : 'People who join rides will appear here'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Professional Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {organization?.name || 'Organization'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {members.length + rideParticipants.length} People
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segment, activeTab === TABS.MEMBERS && styles.activeSegment]}
          onPress={() => setActiveTab(TABS.MEMBERS)}
        >
          <Feather name="users" size={16} color={activeTab === TABS.MEMBERS ? '#00C853' : '#888'} />
          <Text style={[styles.segmentText, activeTab === TABS.MEMBERS && styles.activeSegmentText]}>
            Members ({members.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segment, activeTab === TABS.PARTICIPANTS && styles.activeSegment]}
          onPress={() => setActiveTab(TABS.PARTICIPANTS)}
        >
          <MaterialCommunityIcons
            name="motorbike"
            size={18}
            color={activeTab === TABS.PARTICIPANTS ? '#00C853' : '#888'}
          />
          <Text style={[styles.segmentText, activeTab === TABS.PARTICIPANTS && styles.activeSegmentText]}>
            Participants ({rideParticipants.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, email..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderPerson}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchAllPeople}
      />

      {/* Person Detail Modal */}
      <Modal
        visible={!!selectedPerson}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPerson(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPerson && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalAvatar, { backgroundColor: getAvatarColor(selectedPerson.name) }]}>
                      <Text style={styles.modalAvatarText}>{generateInitials(selectedPerson.name)}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPerson(null)}>
                      <Feather name="x" size={24} color="#888" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalName}>{selectedPerson.name}</Text>

                  {selectedPerson.role && (
                    <View style={[styles.modalRoleBadge, { backgroundColor: getRoleBadge(selectedPerson.role).bg }]}>
                      <Text style={[styles.modalRoleText, { color: getRoleBadge(selectedPerson.role).color }]}>
                        {getRoleBadge(selectedPerson.role).label}
                      </Text>
                    </View>
                  )}

                  {/* Ride Stats */}
                  {selectedPerson.attendance && (
                    <View style={styles.statsCard}>
                      <Text style={styles.sectionTitle}>Ride Stats</Text>
                      <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                          <Text style={styles.statValue}>{selectedPerson.attendance.total_rides}</Text>
                          <Text style={styles.statLabel}>Registered</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                          <Text style={styles.statValue}>{selectedPerson.attendance.completed_rides || 0}</Text>
                          <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                          <Text style={styles.statValue}>{selectedPerson.attendance.attended}</Text>
                          <Text style={styles.statLabel}>Attended</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                          <Text style={[styles.statValue, { color: getAttendanceColor(selectedPerson.attendance.attendance_rate) }]}>
                            {selectedPerson.attendance.attendance_rate}%
                          </Text>
                          <Text style={styles.statLabel}>Rate</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Contact Info */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    {selectedPerson.phone && (
                      <View style={styles.detailRow}>
                        <Feather name="phone" size={16} color="#00C853" />
                        <Text style={styles.detailText}>{selectedPerson.phone}</Text>
                      </View>
                    )}
                    {selectedPerson.email && (
                      <View style={styles.detailRow}>
                        <Feather name="mail" size={16} color="#00C853" />
                        <Text style={styles.detailText}>{selectedPerson.email}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Feather name="calendar" size={16} color="#00C853" />
                      <Text style={styles.detailText}>Joined: {selectedPerson.created_at}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Feather
                        name={selectedPerson.is_active ? "check-circle" : "x-circle"}
                        size={16}
                        color={selectedPerson.is_active ? "#00C853" : "#FF5252"}
                      />
                      <Text style={styles.detailText}>
                        {selectedPerson.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  {/* Vehicles */}
                  {selectedPerson.vehicles && selectedPerson.vehicles.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Vehicles ({selectedPerson.vehicles.length})</Text>
                      {selectedPerson.vehicles.map((vehicle, index) => (
                        <View key={vehicle.id || index} style={styles.vehicleCard}>
                          <MaterialCommunityIcons name="motorbike" size={20} color="#00C853" />
                          <View style={styles.vehicleInfo}>
                            <Text style={styles.vehicleName}>
                              {vehicle.make} {vehicle.model}
                              {vehicle.year && ` (${vehicle.year})`}
                            </Text>
                            {vehicle.license_plate && (
                              <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
                            )}
                          </View>
                          {vehicle.is_primary && (
                            <View style={styles.primaryBadge}>
                              <Text style={styles.primaryText}>Primary</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Admin Actions */}
                  {isAdmin && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.toggleBtn]}
                        onPress={() => handleToggleStatus(selectedPerson.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Feather name={selectedPerson.is_active ? "user-x" : "user-check"} size={18} color="#fff" />
                            <Text style={styles.actionBtnText}>
                              {selectedPerson.is_active ? 'Deactivate' : 'Activate'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.removeBtn]}
                        onPress={() => handleRemovePerson(selectedPerson.id)}
                        disabled={actionLoading}
                      >
                        <Feather name="trash-2" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backBtn: {
    padding: 6,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 34,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeSegment: {
    backgroundColor: '#2A2A2A',
  },
  segmentText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  activeSegmentText: {
    color: '#00C853',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  personName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inactiveBadge: {
    backgroundColor: '#3D0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    color: '#FF5252',
    fontSize: 10,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantText: {
    color: '#888',
    fontSize: 12,
  },
  attendanceIndicator: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attendanceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#555',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRoleBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalRoleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#00C853',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  statsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#444',
  },
  section: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  detailText: {
    color: '#CCC',
    fontSize: 14,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  vehiclePlate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  primaryBadge: {
    backgroundColor: '#003D19',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  primaryText: {
    color: '#00C853',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  toggleBtn: {
    backgroundColor: '#FF9800',
  },
  removeBtn: {
    backgroundColor: '#FF5252',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});