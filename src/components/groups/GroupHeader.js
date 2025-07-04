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

  // ... rest of your existing GroupHeader code

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        
        {/* ... rest of your header content */}
      </View>
      
      {/* ... dropdown modal */}
    </View>
  );
};