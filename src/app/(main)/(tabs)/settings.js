import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import { useAuth } from '@/src/context/AuthContext';
import UserService from '@/src/apis/userService';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Vehicle Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [savingVehicle, setSavingVehicle] = useState(false);

  const fetchData = async () => {
    try {
      const vehicleData = await UserService.getUserVehicles();
      setVehicles(vehicleData?.vehicles || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/(auth)/update_profile');
  };

  // Vehicle Management
  const openVehicleModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setMake(vehicle.make);
      setModel(vehicle.model);
      setPlate(vehicle.license_plate || '');
      setModalVisible(true);
    } else {
      if (vehicles.length >= 3) {
        Alert.alert('Limit Reached', 'You can only have up to 3 vehicles.');
        return;
      }
      setEditingVehicle(null);
      setMake('');
      setModel('');
      setPlate('');
      setModalVisible(true);
    }
  };

  const handleSaveVehicle = async () => {
    if (!make.trim() || !model.trim() || !plate.trim()) {
      Alert.alert('Error', 'Please fill in all fields (Make, Model, License Plate)');
      return;
    }

    setSavingVehicle(true);
    try {
      const payload = {
        make,
        model,
        license_plate: plate,
        is_primary: editingVehicle ? editingVehicle.is_primary : (vehicles.length === 0),
        is_pillion: false
      };

      if (editingVehicle) {
        await UserService.updateVehicle(editingVehicle.id, payload);
        Alert.alert('Success', 'Vehicle updated');
      } else {
        await UserService.addVehicle(payload);
        Alert.alert('Success', 'Vehicle added');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Save vehicle failed:', error);
      Alert.alert('Error', error.message || 'Failed to save vehicle');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = (vehicleId) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserService.deleteVehicle(vehicleId);
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          }
        }
      ]
    );
  };

  if (isLoading || authLoading) {
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
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
              {user?.role === 'super_admin' && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Super Admin</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Feather name="edit-2" size={18} color="#00C853" />
          </TouchableOpacity>
        </View>

        {/* Vehicles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name="truck" size={20} color="#00C853" />
              <Text style={styles.sectionTitle}>My Vehicles ({vehicles.length}/3)</Text>
            </View>
            <TouchableOpacity onPress={() => openVehicleModal(null)}>
              <Feather name="plus-circle" size={20} color="#00C853" />
            </TouchableOpacity>
          </View>

          {vehicles.length > 0 ? (
            vehicles.map((vehicle, index) => (
              <View key={vehicle.id || index} style={styles.vehicleCard}>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>
                    {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openVehicleModal(vehicle)}>
                    <Feather name="edit-2" size={18} color="#ddd" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteVehicle(vehicle.id)}>
                    <Feather name="trash-2" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="alert-circle" size={24} color="#666" />
              <Text style={styles.emptyText}>No vehicles added</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => openVehicleModal(null)}>
                <Text style={styles.addButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="settings" size={20} color="#00C853" />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="bell" size={20} color="#999" />
            <Text style={styles.menuText}>Notifications</Text>
            <Feather name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="shield" size={20} color="#999" />
            <Text style={styles.menuText}>Privacy</Text>
            <Feather name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="help-circle" size={20} color="#999" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Feather name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#ff4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Squadra v1.0.0</Text>
      </ScrollView>

      {/* Add/Edit Vehicle Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Make</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Royal Enfield"
                placeholderTextColor="#666"
                value={make}
                onChangeText={setMake}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Himalayan"
                placeholderTextColor="#666"
                value={model}
                onChangeText={setModel}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Plate</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. KA 01 AB 1234"
                placeholderTextColor="#666"
                value={plate}
                onChangeText={setPlate}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveVehicle}
              disabled={savingVehicle}
            >
              {savingVehicle ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Vehicle</Text>}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  profileCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#00C853',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    padding: 10,
  },
  section: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    padding: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#00C853',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
  },
  versionText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#aaa',
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#00C853',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
