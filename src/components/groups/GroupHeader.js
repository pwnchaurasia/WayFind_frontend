import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/src/constants/colors';

const GroupHeader = ({ group, showBackButton = true }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const generateInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colorOptions = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorOptions[Math.abs(hash) % colorOptions.length];
  };

  if (!group) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        
        <View style={styles.groupInfo}>
          {group.image ? (
            <Image source={{ uri: group.image }} style={styles.groupImage} />
          ) : (
            <View style={[styles.groupImagePlaceholder, { backgroundColor: getInitialsColor(group.name) }]}>
              <Text style={styles.groupImageText}>{generateInitials(group.name)}</Text>
            </View>
          )}
          
          <View style={styles.groupDetails}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupStatus}>
              {group.onlineCount || 0} online, {group.memberCount || 0} members
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setShowDropdown(true)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownItem}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.dropdownText}>Group Info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem}>
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.dropdownText}>Mute</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem}>
              <Ionicons name="exit-outline" size={20} color={colors.error} />
              <Text style={[styles.dropdownText, { color: colors.error }]}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  groupImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  groupDetails: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  groupStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  moreButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
  },
});

export default GroupHeader;
