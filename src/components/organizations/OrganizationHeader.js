import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { globalStyles, getAvatarColor, generateInitials } from '@/src/styles/globalStyles';
import { theme } from '@/src/styles/theme';

const OrganizationHeader = ({ organization, showBackButton = true }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleBack = () => {
    router.back();
  };

  if (!organization) {
    return <View style={globalStyles.header} />;
  }

  return (
    <View style={globalStyles.header}>
      <View style={globalStyles.headerContent}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBack} style={globalStyles.headerButton}>
            <Ionicons name="arrow-back" size={theme.fontSize.xl} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={styles.orgInfo}>
          {organization.image ? (
            <Image source={{ uri: organization.image }} style={globalStyles.avatarMedium} />
          ) : (
            <View style={[globalStyles.avatar, globalStyles.avatarPlaceholder, { backgroundColor: getAvatarColor(organization.name) }]}>
              <Text style={[globalStyles.avatarText, globalStyles.avatarTextMedium]}>{generateInitials(organization.name)}</Text>
            </View>
          )}

          <View style={styles.orgDetails}>
            <Text style={styles.orgName}>{organization.name}</Text>
            <Text style={styles.orgStatus}>
              {organization.member_count || organization.members?.length || 0} members
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={globalStyles.headerButton}
          onPress={() => setShowDropdown(true)}
        >
          <Ionicons name="ellipsis-vertical" size={theme.fontSize.lg} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={globalStyles.modalOverlay}
          onPress={() => setShowDropdown(false)}
        >
          <View style={globalStyles.dropdown}>
            <TouchableOpacity style={globalStyles.dropdownItem}>
              <Ionicons name="information-circle-outline" size={theme.fontSize.lg} color={theme.colors.textPrimary} />
              <Text style={globalStyles.dropdownText}>Organization Info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={globalStyles.dropdownItem}>
              <Ionicons name="notifications-outline" size={theme.fontSize.lg} color={theme.colors.textPrimary} />
              <Text style={globalStyles.dropdownText}>Mute</Text>
            </TouchableOpacity>
            <TouchableOpacity style={globalStyles.dropdownItem}>
              <Ionicons name="exit-outline" size={theme.fontSize.lg} color={theme.colors.error} />
              <Text style={[globalStyles.dropdownText, { color: theme.colors.error }]}>Leave Organization</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgDetails: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  orgName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  orgStatus: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});

export default OrganizationHeader;
