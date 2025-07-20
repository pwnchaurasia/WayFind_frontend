
// src/components/CreateJoinGroupModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/src/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import GroupService from '@/src/apis/groupService';

const CreateJoinGroupModal = ({ visible, onClose, onCreateGroup, onJoinGroup }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [groupCode, setGroupCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const payload = {
      name: groupName,
      image: groupImage,
    };

    // Simulate API call and generate link
    try {
      const createGroupResponse = await GroupService.createGroup(payload);

      // Success - everything worked
      console.log('Group created successfully:', groupData);
      onCreateGroup(groupData.group);
      setGeneratedLink(groupData.group.join_url);
      // Parent will close modal via onCreateGroup
    } catch (error) {
      // All errors come here - show user the error message
      console.log('Create group error:', error);
      Alert.alert('Error', error.message);
      // Modal stays open for retry
    }finally {
      resetForm();
    }

    
    
  };

  const handleJoinGroup = () => {
    if (!groupCode.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }
    console.log('I am here in handle join group');
    onJoinGroup(groupCode);
    resetForm();
  };

  const resetForm = () => {
    setGroupName('');
    setGroupImage(null);
    setGroupCode('');
    setGeneratedLink('');
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(generatedLink);
    Alert.alert('Success', 'Link copied to clipboard!');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectImage = async () => {
      try {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'We need access to your photo library to select a profile picture.',
            [{ text: 'OK' }]
          );
          return;
        }
  
        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.mediaTypes,
          allowsEditing: true,
          aspect: [1, 1], // Square aspect ratio
          quality: 0.8,
          allowsMultipleSelection: false,
        });
  
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setGroupImage(result.assets[0].uri);
        }
      } catch (error) {
        console.error('Error selecting image:', error);
        Alert.alert('Error', 'Failed to select image. Please try again.');
      }
    };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {activeTab === 'create' ? 'Create Group' : 'Join Group'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'create' && styles.activeTab]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
                Create Group
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'join' && styles.activeTab]}
              onPress={() => setActiveTab('join')}
            >
              <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>
                Join Group
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'create' ? (
              <View>
                {/* Group Image */}
                <TouchableOpacity style={styles.imageContainer} onPress={selectImage}>
                  {groupImage ? (
                    <Image source={{ uri: groupImage }} style={styles.groupImage} />
                  ) : (
                    
                    <View style={styles.imagePlaceholder}>
                      <Icon name="camera-alt" size={24} color={colors.textSecondary} />
                      <Text style={styles.imageText}>Add Group Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Group Name Input */}
                <TextInput
                  style={styles.input}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Enter group name"
                  placeholderTextColor={colors.textSecondary}
                />

                {/* Generated Link */}
                {generatedLink ? (
                  <View style={styles.linkContainer}>
                    <Text style={styles.linkLabel}>Share this link:</Text>
                    <View style={styles.linkRow}>
                      <Text style={styles.linkText} numberOfLines={1}>
                        {generatedLink}
                      </Text>
                      <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                        <Icon name="content-copy" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* Create Button */}
                <TouchableOpacity style={styles.actionButton} onPress={handleCreateGroup}>
                  <Text style={styles.actionButtonText}>Create Group</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* Group Code Input */}
                <TextInput
                  style={styles.input}
                  value={groupCode}
                  onChangeText={setGroupCode}
                  placeholder="Enter group code"
                  placeholderTextColor={colors.textSecondary}
                />

                {/* Join Button */}
                <TouchableOpacity style={styles.actionButton} onPress={handleJoinGroup}>
                  <Text style={styles.actionButtonText}>Join Group</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  linkContainer: {
    marginBottom: 20,
  },
  linkLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: 12,
  },
  copyButton: {
    padding: 4,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateJoinGroupModal;
