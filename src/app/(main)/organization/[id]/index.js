import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
// import OrganizationHeader from '@/src/components/organizations/OrganizationHeader'; // To be migrated
import { useOrganizationData } from '@/src/hooks/useOrganizationData';
import OrganizationService from '@/src/apis/organizationService';
import { theme } from '@/src/styles/theme';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrganizationOverview() {
  const { id } = useLocalSearchParams();
  const { organization, refreshOrganization } = useOrganizationData(id);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRides = async () => {
    try {
      if (id) {
        const data = await OrganizationService.getOrganizationRides(id);
        setRides(data.rides || []);
      }
    } catch (error) {
      console.error("Failed to fetch rides", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (id) fetchRides();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshOrganization();
    fetchRides();
  };

  const renderRideItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(main)/rides/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.rideName}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'ACTIVE' ? '#00C853' : '#FFB300' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.detailText}>
        <Feather name="calendar" size={12} /> {new Date(item.start_time || Date.now()).toLocaleDateString()}
      </Text>
      <Text style={styles.detailText}>
        <Feather name="map-pin" size={12} /> {item.checkpoints?.length || 0} Checkpoints
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {organization && (
        <View style={styles.header}>
          <Text style={styles.title}>{organization.name}</Text>
          <Text style={styles.description}>{organization.description}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="users" size={16} color="#AAA" />
              <Text style={styles.statText}>{organization.members?.length || 0} Members</Text>
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
              <Text style={styles.emptyText}>No rides scheduled.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8
  },
  description: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 12
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statText: {
    color: '#AAA',
    fontSize: 14
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12
  },
  listContainer: {
    padding: 20
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
    alignItems: 'center',
    marginBottom: 8
  },
  rideName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'black'
  },
  detailText: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 4
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    color: '#666',
    fontSize: 16
  }
});
