import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GroupHeader from '@/src/components/groups/GroupHeader';
import { useGroupData } from '@/src/hooks/useGroupData';

export default function SettingsScreen() {
  const { id } = useGlobalSearchParams();
  const { group, loading } = useGroupData(id);

  if (loading || !group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const settingsOptions = [
    {
      title: 'Group Info',
      icon: 'information-circle-outline',
      onPress: () => console.log('Group Info pressed'),
    },
    {
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => console.log('Notifications pressed'),
    },
    {
      title: 'Privacy',
      icon: 'lock-closed-outline',
      onPress: () => console.log('Privacy pressed'),
    },
    {
      title: 'Location Sharing',
      icon: 'location-outline',
      onPress: () => console.log('Location Sharing pressed'),
    },
    {
      title: 'Media & Files',
      icon: 'folder-outline',
      onPress: () => console.log('Media & Files pressed'),
    },
    {
      title: 'Export Chat',
      icon: 'download-outline',
      onPress: () => console.log('Export Chat pressed'),
    },
    {
      title: 'Leave Group',
      icon: 'exit-outline',
      onPress: () => console.log('Leave Group pressed'),
      danger: true,
    },
  ];

  return (
    <View style={styles.container}>
      <GroupHeader group={group} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Group Settings</Text>
        
        <View style={styles.settingsContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                index === settingsOptions.length - 1 && styles.lastItem,
              ]}
              onPress={option.onPress}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={option.danger ? '#FF4444' : '#00C853'}
                />
                <Text style={[
                  styles.settingText,
                  option.danger && styles.dangerText
                ]}>
                  {option.title}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Group ID: {group.id}
          </Text>
          <Text style={styles.infoText}>
            Created: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: '#121212',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 30,
  },
  settingsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
  },
  dangerText: {
    color: '#FF4444',
  },
  infoContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
});
