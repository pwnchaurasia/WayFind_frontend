import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/src/styles/theme';

export default function OrganizationLayout() {
  // Don't fetch organization data at layout level
  // Let individual pages handle their own data fetching
  // This prevents the bug where ride ID gets sent to organization API

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
