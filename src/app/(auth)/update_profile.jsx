import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/styles/theme';
import { Feather } from '@expo/vector-icons';
import imagePath from '@/src/constants/imagePath';
import LogoSection from '@/src/components/LogoSection';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/context/AuthContext';
import UserService from '@/src/apis/userService';

const { width, height } = Dimensions.get('window');

const UpdateProfile = () => {
  const { updateProfileCompletion, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameCount, setNameCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);

  // Vehicle State
  const [hasVehicle, setHasVehicle] = useState(true);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  console.log("user here test test test", user);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // 1. Update Basic Profile
      const profilePayload = {
        name,
        email
      };

      const response = await UserService.updateCurrentUserProfile(profilePayload);
      if (response.status !== 202 && response.status !== 200) {
        throw new Error('Failed to update profile');
      }

      // 2. Add Vehicle if applicable
      debugger
      if (hasVehicle) {
        if (!vehicleMake || !vehicleModel || !vehicleNumber) {
          Alert.alert('Missing Info', 'Please fill in all vehicle details or uncheck "I have a motorcycle".');
          setIsLoading(false);
          return;
        }

        const vehiclePayload = {
          make: vehicleMake,
          model: vehicleModel,
          license_plate: vehicleNumber,
          is_primary: true,
          is_pillion: false
        };
        await UserService.addVehicle(vehiclePayload);
      }

      // Success
      updateProfileCompletion(true);
      console.log("Success! Navigating now...");
      router.push("/(main)");

    } catch (error) {
      debugger
      console.error("Profile/Vehicle update failed:", error);
      Alert.alert('Error', 'Failed to complete profile setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (newText) => {
    const validText = newText.replace(/[^a-zA-Z\s]/g, '');
    setName(validText);
  };

  const selectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to select a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Scroll to focused input
  const handleInputFocus = (yOffset) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <LogoSection />

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Update Profile</Text>

            {/* Profile Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>M</Text>
                )}
              </View>
              <TouchableOpacity style={styles.editIcon} onPress={selectImage}>
                <Feather name="edit-2" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* Profile Fields */}
            <View style={styles.fieldsContainer}>
              {/* Name Field */}
              <View style={styles.fieldWrapper}>
                <View style={styles.iconContainer}>
                  <Feather name="user" size={24} color="#00C853" />
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={handleTextChange}
                    placeholderTextColor="#666"
                    placeholder="Your Good Name"
                    maxLength={20}
                    onFocus={() => handleInputFocus(0)}
                    onChange={(event) => {
                      setNameCount(event.nativeEvent.text.length);
                    }}
                  />
                  <Text style={styles.fieldLabel}>Name</Text>
                  <View style={styles.counterContainer}>
                    <Text style={styles.counter}> {nameCount} <Text style={styles.maxCount}>/ 20</Text></Text>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              {/* Email Field */}
              <View style={styles.fieldWrapper}>
                <View style={styles.iconContainer}>
                  <Feather name="at-sign" size={24} color="#00C853" />
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    placeholder="youremail@example.com"
                    onFocus={() => handleInputFocus(50)}
                  />
                  <Text style={styles.fieldLabel}>Email</Text>
                </View>
              </View>

              <View style={styles.separator} />

              {/* Vehicle Section Header */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setHasVehicle(!hasVehicle)}
              >
                <View style={[
                  styles.checkbox,
                  hasVehicle && styles.checkboxChecked
                ]}>
                  {hasVehicle && <Feather name="check" size={14} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>I have a motorcycle</Text>
              </TouchableOpacity>

              {hasVehicle && (
                <>
                  <View style={styles.separator} />

                  {/* Make Field */}
                  <View style={styles.fieldWrapper}>
                    <View style={styles.iconContainer}>
                      <Feather name="tool" size={24} color="#00C853" />
                    </View>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={vehicleMake}
                        onChangeText={setVehicleMake}
                        placeholderTextColor="#666"
                        placeholder="Vehicle Make (e.g. Royal Enfield)"
                        onFocus={() => handleInputFocus(200)}
                      />
                      <Text style={styles.fieldLabel}>Make</Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Model Field */}
                  <View style={styles.fieldWrapper}>
                    <View style={styles.iconContainer}>
                      <Feather name="activity" size={24} color="#00C853" />
                    </View>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={vehicleModel}
                        onChangeText={setVehicleModel}
                        placeholderTextColor="#666"
                        placeholder="Vehicle Model (e.g. Himalayan 450)"
                        onFocus={() => handleInputFocus(280)}
                      />
                      <Text style={styles.fieldLabel}>Model</Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Number Plate Field */}
                  <View style={styles.fieldWrapper}>
                    <View style={styles.iconContainer}>
                      <Feather name="hash" size={24} color="#00C853" />
                    </View>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={vehicleNumber}
                        onChangeText={setVehicleNumber}
                        placeholderTextColor="#666"
                        placeholder="License Plate (e.g. KA 01 AB 1234)"
                        onFocus={() => handleInputFocus(360)}
                      />
                      <Text style={styles.fieldLabel}>License Plate</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
              onPress={handleSubmit}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Done</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Made with love in India by rjsnh1522</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UpdateProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05,
    paddingBottom: 30,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 25,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#333',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  fieldsContainer: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    marginBottom: 20,
  },
  fieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  iconContainer: {
    marginRight: 15,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    color: 'white',
    fontSize: 16,
    paddingVertical: 5,
    width: '100%',
  },
  fieldLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  counterContainer: {
    position: 'absolute',
    right: 0,
    top: 5,
  },
  counter: {
    color: 'white',
    fontSize: 14,
  },
  maxCount: {
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginLeft: 50,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#00C853',
  },
  checkboxLabel: {
    color: 'white',
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  button: {
    backgroundColor: theme.colors.buttonBackgroundGreen || '#00C853',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    width: '80%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
});
