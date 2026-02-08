import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import OrganizationHeader from '@/src/components/organizations/OrganizationHeader';
import { useOrganizationData } from '@/src/hooks/useOrganizationData';
import OrganizationService from '@/src/apis/organizationService';
import { globalStyles } from '@/src/styles/globalStyles';

export default function SettingsScreen() {
  const { id } = useLocalSearchParams();
  const { organization, loading } = useOrganizationData(id);

  // Join code state
  const [joinCode, setJoinCode] = useState(null);
  const [joinUrl, setJoinUrl] = useState(null);
  const [joinCodeLoading, setJoinCodeLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch join code on mount
  useEffect(() => {
    if (id) {
      fetchJoinCode();
    }
  }, [id]);

  const fetchJoinCode = async () => {
    setJoinCodeLoading(true);
    try {
      const response = await OrganizationService.getJoinCode(id);
      if (response.status === 'success') {
        setJoinCode(response.join_code);
        setJoinUrl(response.join_url);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.log('Not an admin or error fetching join code');
      setIsAdmin(false);
    } finally {
      setJoinCodeLoading(false);
    }
  };

  const handleRefreshJoinCode = async () => {
    Alert.alert(
      'Refresh Join Link',
      'This will invalidate the current link. Anyone with the old link won\'t be able to join. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refresh',
          style: 'destructive',
          onPress: async () => {
            setRefreshLoading(true);
            try {
              const response = await OrganizationService.refreshJoinCode(id);
              if (response.status === 'success') {
                setJoinCode(response.join_code);
                setJoinUrl(response.join_url);
                Alert.alert('Success', 'Join link refreshed successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to refresh');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to refresh join link');
            } finally {
              setRefreshLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCopyLink = async () => {
    if (joinUrl) {
      await Clipboard.setStringAsync(joinUrl);
      Alert.alert('Copied!', 'Join link copied to clipboard');
    }
  };

  const handleShareLink = async () => {
    if (joinUrl) {
      try {
        await Share.share({
          message: `Join ${organization?.name} on SQUADRA!\n\n${joinUrl}`,
          title: `Join ${organization?.name}`
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (loading || !organization) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const settingsOptions = [
    {
      title: 'Organization Info',
      icon: 'information-circle-outline',
      onPress: () => console.log('Org Info pressed'),
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
      title: 'Leave Organization',
      icon: 'exit-outline',
      onPress: () => console.log('Leave Org pressed'),
      danger: true,
    },
  ];

  return (
    <View style={styles.container}>
      <OrganizationHeader organization={organization} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Organization Settings</Text>

        {/* Invite Link Section (Admin Only) */}
        {isAdmin && (
          <View style={styles.inviteSection}>
            <View style={styles.sectionHeader}>
              <Feather name="link" size={20} color="#00C853" />
              <Text style={styles.sectionTitle}>Invite Link</Text>
            </View>

            {joinCodeLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#00C853" />
              </View>
            ) : (
              <>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Join Code</Text>
                  <Text style={styles.codeText}>{joinCode || 'N/A'}</Text>
                </View>

                <View style={styles.linkBox}>
                  <Text style={styles.linkText} numberOfLines={1}>{joinUrl}</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleCopyLink}
                  >
                    <Feather name="copy" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.shareBtn]}
                    onPress={handleShareLink}
                  >
                    <Feather name="share-2" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.refreshBtn]}
                    onPress={handleRefreshJoinCode}
                    disabled={refreshLoading}
                  >
                    {refreshLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Refresh</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.hintText}>
                  Share this link to let people join your organization
                </Text>
              </>
            )}
          </View>
        )}

        {/* Settings Options */}
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
            Organization ID: {organization.id}
          </Text>
          <Text style={styles.infoText}>
            Established: {new Date(organization.created_at || Date.now()).toLocaleDateString()}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
  },

  // Invite Section Styles
  inviteSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00C853',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#00C853',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  codeBox: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  codeLabel: {
    color: '#888',
    fontSize: 10,
    marginBottom: 2,
  },
  codeText: {
    color: '#00C853',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  linkBox: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  linkText: {
    color: '#999',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C853',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  shareBtn: {
    backgroundColor: '#2196F3',
  },
  refreshBtn: {
    backgroundColor: '#FF9800',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
  hintText: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },

  // Settings Options Styles
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
