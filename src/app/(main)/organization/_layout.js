import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';
import { theme } from '@/src/styles/theme';

export default function OrganizationLayout() {
  const { id } = useGlobalSearchParams();
  const { organization, loading } = useOrganizationData(id);

  if (loading && !organization) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    )
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00C853',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 12, marginBottom: 4 }
      }}
    >
      <Tabs.Screen
        name="[id]/index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => (
            <Feather name="grid" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="[id]/members"
        options={{
          title: 'Members',
          tabBarIcon: ({ color }) => (
            <Feather name="users" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="[id]/settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={24} color={color} />
          ),
        }}
      />

      {/* Hide unused screens from tab bar */}
      <Tabs.Screen name="[id]/map" options={{ href: null }} />
      <Tabs.Screen name="voice-recorder" options={{ href: null }} />
      <Tabs.Screen name="create" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background || '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  }
});
