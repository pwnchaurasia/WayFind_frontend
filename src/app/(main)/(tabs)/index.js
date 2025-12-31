import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import { useAuth } from '@/src/context/AuthContext';
import { router } from 'expo-router';
import OrganizationService from '@/src/apis/organizationService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingRides: 0,
    myOrganizations: 0,
    completedRides: 0,
    activeRides: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  const fetchData = async () => {
    try {
      const dashboardData = await OrganizationService.getDashboard();

      if (dashboardData?.stats) {
        setStats({
          myOrganizations: dashboardData.stats.my_organizations || dashboardData.stats.total_organizations || 0,
          upcomingRides: dashboardData.stats.upcoming_rides || 0,
          completedRides: dashboardData.stats.completed_rides || 0,
          activeRides: dashboardData.stats.active_rides || 0
        });
      }

      setIsSuperAdmin(dashboardData?.is_super_admin || false);
      setIsOrgAdmin(dashboardData?.is_org_admin || false);

    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C853" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Rider'}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(main)/(tabs)/settings')}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(main)/(tabs)/organizations')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#00C85320' }]}>
              <Feather name="users" size={24} color="#00C853" />
            </View>
            <Text style={styles.statNumber}>{stats.myOrganizations}</Text>
            <Text style={styles.statLabel}>Communities</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(main)/(tabs)/rides')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#2196F320' }]}>
              <Feather name="map" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statNumber}>{stats.upcomingRides}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FF980020' }]}>
              <Feather name="award" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{stats.completedRides}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(main)/(tabs)/organizations')}
            >
              <Feather name="users" size={28} color="#00C853" />
              <Text style={styles.actionText}>My Communities</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(main)/(tabs)/rides')}
            >
              <Feather name="navigation" size={28} color="#2196F3" />
              <Text style={styles.actionText}>Browse Rides</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(main)/(tabs)/settings')}
            >
              <Feather name="user" size={28} color="#9C27B0" />
              <Text style={styles.actionText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(main)/(tabs)/settings')}
            >
              <Feather name="truck" size={28} color="#FF9800" />
              <Text style={styles.actionText}>My Vehicles</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <View style={styles.adminCard}>
              <Feather name="shield" size={24} color="#00C853" />
              <View style={styles.adminCardContent}>
                <Text style={styles.adminCardTitle}>Super Admin</Text>
                <Text style={styles.adminCardSubtitle}>
                  You have full access to all organizations and users
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Org Admin Section */}
        {isOrgAdmin && !isSuperAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <View style={[styles.adminCard, { borderLeftColor: '#2196F3' }]}>
              <Feather name="briefcase" size={24} color="#2196F3" />
              <View style={styles.adminCardContent}>
                <Text style={styles.adminCardTitle}>Organization Admin</Text>
                <Text style={styles.adminCardSubtitle}>
                  Manage your community members and rides
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Rides */}
        {stats.activeRides > 0 && (
          <View style={styles.section}>
            <View style={styles.alertCard}>
              <Feather name="zap" size={20} color="#FF9800" />
              <Text style={styles.alertText}>
                You have {stats.activeRides} active ride{stats.activeRides > 1 ? 's' : ''}!
              </Text>
            </View>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riding Tips</Text>
          <View style={styles.tipCard}>
            <Feather name="sun" size={20} color="#FF9800" />
            <Text style={styles.tipText}>
              Always check the weather before heading out for a ride!
            </Text>
          </View>
        </View>

      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#999',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  adminCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00C853',
  },
  adminCardContent: {
    flex: 1,
  },
  adminCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  adminCardSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#FF980020',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  tipCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
});
