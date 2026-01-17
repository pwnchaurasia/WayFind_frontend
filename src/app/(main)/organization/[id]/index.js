import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';
import OrganizationService from '@/src/apis/organizationService';
import { theme } from '@/src/styles/theme';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Status filter options
const STATUS_FILTERS = [
  { key: 'upcoming', label: 'Upcoming', icon: 'clock' },
  { key: 'active', label: 'Active', icon: 'play-circle' },
  { key: 'completed', label: 'Completed', icon: 'check-circle' },
  { key: 'all', label: 'All', icon: 'list' },
];

export default function OrganizationOverview() {
  const { id } = useLocalSearchParams();
  const { organization, refreshOrganization } = useOrganizationData(id);
  const [rides, setRides] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('upcoming');

  const fetchData = async () => {
    try {
      if (id) {
        // Fetch rides and members in parallel for faster loading
        const [ridesData, membersData] = await Promise.all([
          OrganizationService.getOrganizationRides(id, statusFilter === 'all' || statusFilter === 'completed'),
          OrganizationService.getMembers(id)
        ]);

        console.log('Rides data:', ridesData);
        console.log('Members data:', membersData);

        // API returns rides array - already sorted by backend
        const ridesArray = ridesData?.rides || [];
        setRides(ridesArray);
        setMembers(membersData?.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (id) fetchData();
  }, [id, statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshOrganization();
    fetchData();
  };

  // Filter rides based on selected status
  const filteredRides = useMemo(() => {
    if (statusFilter === 'all') return rides;
    if (statusFilter === 'upcoming') {
      return rides.filter(r => r.status?.toLowerCase() === 'planned' || r.status?.toLowerCase() === 'active');
    }
    return rides.filter(r => r.status?.toLowerCase() === statusFilter);
  }, [rides, statusFilter]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return theme.colors.primary;
      case 'planned': return '#2196F3';
      case 'completed': return '#9E9E9E';
      case 'draft': return '#FF9800';
      default: return '#FFB300';
    }
  };

  const formatRideType = (type) => {
    if (!type) return 'General';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderRideItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(main)/rides/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.rideTitleSection}>
          <Text style={styles.rideName}>{item.name}</Text>
          <View style={[styles.typeBadge]}>
            <Text style={styles.typeText}>{formatRideType(item.ride_type)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(item.scheduled_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="users" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            {item.participants_count || 0}/{item.max_riders || 30} riders
          </Text>
        </View>
      </View>

      {/* Payment info */}
      {item.requires_payment && (
        <View style={styles.paymentRow}>
          <Feather name="dollar-sign" size={14} color="#FFD700" />
          <Text style={styles.paymentText}>
            ₹{item.amount || 0} • {item.paid_count || 0} paid
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && !organization) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back Button Header */}
      <View style={styles.backHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(main)/(tabs)/organizations')}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.backHeaderTitle} numberOfLines={1}>
          {organization?.name || 'Community'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {organization && (
        <View style={styles.header}>
          <Text style={styles.description} numberOfLines={2}>
            {organization.description || 'No description'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="users" size={16} color={theme.colors.primary} />
              <Text style={styles.statText}>{members.length} Members</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="navigation" size={16} color="#2196F3" />
              <Text style={styles.statText}>{rides.length} Rides</Text>
            </View>
          </View>
        </View>
      )}

      {/* Status Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                statusFilter === filter.key && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter(filter.key)}
            >
              <Feather
                name={filter.icon}
                size={14}
                color={statusFilter === filter.key ? theme.colors.textPrimary : theme.colors.textSecondary}
              />
              <Text style={[
                styles.filterText,
                statusFilter === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {statusFilter === 'upcoming' ? 'Upcoming Rides' :
            statusFilter === 'active' ? 'Active Rides' :
              statusFilter === 'completed' ? 'Past Rides' : 'All Rides'}
          {filteredRides.length > 0 && ` (${filteredRides.length})`}
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push({ pathname: '/(main)/rides/create', params: { orgId: id } })}
        >
          <Feather name="plus" size={16} color="white" />
          <Text style={styles.createButtonText}>New Ride</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRides}
        renderItem={renderRideItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="map" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>
                {statusFilter === 'completed' ? 'No completed rides yet' :
                  statusFilter === 'active' ? 'No active rides' :
                    'No upcoming rides scheduled'}
              </Text>
              <Text style={styles.emptySubtext}>
                {statusFilter !== 'completed' && 'Create a new ride to get started!'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  // Back Header
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  backHeaderTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    marginBottom: theme.spacing.md,
    lineHeight: 20
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs
  },
  statText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium
  },
  // Filter tabs
  filterSection: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.md,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  filterTextActive: {
    color: theme.colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.xs
  },
  createButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingTop: 0
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md
  },
  rideTitleSection: {
    flex: 1,
    marginRight: theme.spacing.sm
  },
  rideName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm
  },
  typeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary
  },
  rideDetails: {
    flexDirection: 'row',
    gap: theme.spacing.lg
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs
  },
  detailText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  paymentText: {
    color: '#FFD700',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: theme.spacing.md
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.lg,
    textAlign: 'center'
  },
  emptySubtext: {
    color: theme.colors.placeholderText,
    fontSize: theme.fontSize.md,
    textAlign: 'center'
  }
});
