import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';
import OrganizationService from '@/src/apis/organizationService';
import { theme } from '@/src/styles/theme';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrganizationOverview() {
  const { id } = useLocalSearchParams();
  const { organization, refreshOrganization } = useOrganizationData(id);
  const [rides, setRides] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      if (id) {
        // Fetch rides and members in parallel for faster loading
        const [ridesData, membersData] = await Promise.all([
          OrganizationService.getOrganizationRides(id),
          OrganizationService.getMembers(id)
        ]);

        console.log('Rides data:', ridesData);
        console.log('Members data:', membersData);

        // API returns rides array - sort by scheduled_date
        const ridesArray = ridesData?.rides || [];
        ridesArray.sort((a, b) => {
          if (!a.scheduled_date) return 1;
          if (!b.scheduled_date) return -1;
          return new Date(b.scheduled_date) - new Date(a.scheduled_date);
        });
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
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshOrganization();
    fetchData();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#00C853';
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
          <Feather name="calendar" size={14} color="#AAA" />
          <Text style={styles.detailText}>
            {item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'TBD'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="users" size={14} color="#AAA" />
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
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {organization && (
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{organization.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {organization.description || 'No description'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="users" size={16} color="#00C853" />
              <Text style={styles.statText}>{members.length} Members</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="navigation" size={16} color="#2196F3" />
              <Text style={styles.statText}>{rides.length} Rides</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Rides</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push({ pathname: '/(main)/rides/create', params: { orgId: id } })}
        >
          <Feather name="plus" size={16} color="white" />
          <Text style={styles.createButtonText}>New Ride</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C853" />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather name="map" size={48} color="#666" />
              <Text style={styles.emptyText}>No rides scheduled yet</Text>
              <Text style={styles.emptySubtext}>Create a new ride to get started!</Text>
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
    backgroundColor: theme.colors?.background || '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors?.background || '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8
  },
  description: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '500'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white'
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C853',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13
  },
  listContainer: {
    padding: 20,
    paddingTop: 0
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  rideTitleSection: {
    flex: 1,
    marginRight: 10
  },
  rideName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  typeText: {
    fontSize: 11,
    color: '#AAA',
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white'
  },
  rideDetails: {
    flexDirection: 'row',
    gap: 20
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  detailText: {
    color: '#AAA',
    fontSize: 14
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333'
  },
  paymentText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '500'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12
  },
  emptyText: {
    color: '#AAA',
    fontSize: 16
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14
  }
});
