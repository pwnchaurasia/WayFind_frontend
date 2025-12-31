import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import OrganizationService from '@/src/apis/organizationService';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';

export default function MembersTabScreen() {
  const { id } = useGlobalSearchParams();
  const { organization } = useOrganizationData(id);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async () => {
    try {
      const response = await OrganizationService.getMembers(id);
      setMembers(response?.members || []);
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

  const getRoleBadge = (role) => {
    const roleStyles = {
      founder: { bg: '#00C853', text: 'Founder' },
      co_founder: { bg: '#2196F3', text: 'Co-Founder' },
      admin: { bg: '#FF9800', text: 'Admin' },
    };
    return roleStyles[role] || { bg: '#666', text: role || 'Member' };
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

  // Sort members alphabetically and by role priority
  const sortedMembers = [...members].sort((a, b) => {
    const rolePriority = { founder: 0, co_founder: 1, admin: 2 };
    const aPriority = rolePriority[a.role] ?? 99;
    const bPriority = rolePriority[b.role] ?? 99;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (a.name || '').localeCompare(b.name || '');
  });

  const renderMemberItem = ({ item }) => {
    const roleInfo = getRoleBadge(item.role);
    const name = item.user?.name || item.name || 'Unknown';
    const email = item.user?.email || item.email;
    const phone = item.user?.phone_number || item.phone_number;

    return (
      <View style={styles.memberCard}>
        <View style={[styles.avatar, { backgroundColor: getInitialsColor(name) }]}>
          <Text style={styles.avatarText}>{generateInitials(name)}</Text>
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>{name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
              <Text style={styles.roleText}>{roleInfo.text}</Text>
            </View>
          </View>

          {email && (
            <View style={styles.infoRow}>
              <Feather name="mail" size={12} color="#666" />
              <Text style={styles.infoText}>{email}</Text>
            </View>
          )}

          {phone && (
            <View style={styles.infoRow}>
              <Feather name="phone" size={12} color="#666" />
              <Text style={styles.infoText}>{phone}</Text>
            </View>
          )}
        </View>
      </View>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{organization?.name || 'Organization'}</Text>
        <Text style={styles.subtitle}>{members.length} Members</Text>
      </View>

      {/* Members List */}
      <FlatList
        data={sortedMembers}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id || item.user_id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C853" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color="#666" />
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        }
      />
    </View>
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
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#999',
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
});