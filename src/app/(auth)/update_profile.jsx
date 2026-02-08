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
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/context/AuthContext';
import UserService from '@/src/apis/userService';

const { width } = Dimensions.get('window');

const UpdateProfile = () => {
  const params = useLocalSearchParams();
  const { updateProfileCompletion, user, refreshUserProfile, isProfileComplete, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1); // 1: Profile, 2: Vehicle

  // Track if we're in setup mode (captured on mount/when user changes)
  // Use ref so it doesn't change after refreshUserProfile updates isProfileComplete
  const isSetupModeRef = useRef(!isProfileComplete);

  // Update ref only when user changes (e.g., on first load) not after profile updates
  useEffect(() => {
    // Only update setup mode ref if user doesn't have a name yet
    const hasName = user?.name && user.name.trim().length > 0;
    isSetupModeRef.current = !hasName && !isProfileComplete;
    console.log('UpdateProfile - isSetupMode:', isSetupModeRef.current, 'hasName:', hasName, 'isProfileComplete:', isProfileComplete);
  }, [user?.id]); // Only re-evaluate when user ID changes (login), not on every profile update

  // Log params for debugging
  console.log('UpdateProfile received params:', params);
  console.log('UpdateProfile returnTo:', params.returnTo);

  // Profile State
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


  // Pre-fill data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      if (user.avatar || user.profile_picture_url) {
        setProfileImage(user.avatar || user.profile_picture_url);
      }
      if (user.name) setNameCount(user.name.length);
    }
  }, [user]);

  const handleBack = () => {
    if (currentStep === 2) {
      // Go back to step 1 from vehicle step
      setCurrentStep(1);
    } else if (isSetupModeRef.current) {
      // In setup mode on step 1, don't allow going back - profile must be completed
      Alert.alert(
        'Complete Profile',
        'Please complete your profile to continue using the app.',
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      // In edit mode, allow going back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(main)");
      }
    }
  };


  const handleTextChange = (newText) => {
    const validText = newText.replace(/[^a-zA-Z\s]/g, '');
    setName(validText);
    setNameCount(validText.length);
  };

  const selectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photo library.');
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
    }
  };

  // Step 1: Update Profile
  const handleNext = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      const profilePayload = { name, email };
      // UserService.updateCurrentUserProfile now handles 200 and 202
      const result = await UserService.updateCurrentUserProfile(profilePayload);
      console.log('Profile update result:', result);

      // Upload Profile Picture if changed and is local file
      if (profileImage && (!user || (profileImage !== user.avatar && profileImage !== user.profile_picture_url))) {
        const isLocal = !profileImage.startsWith('http');
        if (isLocal) {
          try {
            console.log('Uploading new profile image...');
            await UserService.uploadProfilePicture(profileImage);
            console.log('Profile image uploaded successfully');
          } catch (imgError) {
            console.error('Failed to upload profile image:', imgError);
            Alert.alert('Warning', 'Profile updated, but failed to upload image: ' + (imgError.message || 'Unknown error'));
            // Continue execution - don't block flow just for image
          }
        }
      }

      // Refresh user data in context
      await refreshUserProfile();

      if (isSetupModeRef.current) {
        // In setup mode, go to vehicle step
        setCurrentStep(2);
      } else {
        // In edit mode, mark profile as complete and navigate back
        await updateProfileCompletion(true);
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) router.back();
              else router.replace('/(main)');
            }
          }
        ]);
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      Alert.alert('Error', error.message || error.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Add Vehicle (Optional) and Finish
  const handleDone = async () => {
    setIsLoading(true);
    try {
      if (hasVehicle) {
        if (!vehicleMake || !vehicleModel || !vehicleNumber) {
          Alert.alert('Missing Info', 'Please fill all vehicle details or uncheck "I have a motorcycle".');
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

      // Mark profile as complete in context
      await updateProfileCompletion(true);

      // Refresh profile to sync state
      await refreshUserProfile();

      console.log('Profile setup complete, navigating...');
      console.log('returnTo param:', params.returnTo);

      // Small delay to let state propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      // If we have a returnTo (e.g., from join ride/org flow), go there
      // Otherwise go to main screen
      if (params.returnTo) {
        console.log('Redirecting to returnTo:', params.returnTo);
        router.replace(params.returnTo);
      } else {
        router.replace("/(main)");
      }

    } catch (error) {
      console.error("Vehicle update failed:", error);
      Alert.alert('Error', error.message || error.detail || 'Failed to save vehicle details');
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputFocus = (yOffset) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === 1 ? 'Profile Details' : 'Vehicle Details'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

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
          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <View style={styles.contentContainer}>
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
                    <Text style={styles.avatarText}>{name ? name.charAt(0) : 'U'}</Text>
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
              </View>


              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  disabled={isLoading}
                  onPress={handleNext}
                >
                  {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{isSetupModeRef.current ? "Next" : "Update"}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Vehicle */}
          {currentStep === 2 && (
            <View style={styles.contentContainer}>

              <Text style={styles.subTitle}>Add Your Ride</Text>

              <View style={styles.fieldsContainer}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setHasVehicle(!hasVehicle)}
                >
                  <View style={[styles.checkbox, hasVehicle && styles.checkboxChecked]}>
                    {hasVehicle && <Feather name="check" size={14} color="white" />}
                  </View>
                  <Text style={styles.checkboxLabel}>I have a motorcycle</Text>
                </TouchableOpacity>

                {hasVehicle && (
                  <>
                    <View style={styles.separator} />
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
                          placeholder="Make (e.g. Royal Enfield)"
                          onFocus={() => handleInputFocus(0)}
                        />
                        <Text style={styles.fieldLabel}>Make</Text>
                      </View>
                    </View>

                    <View style={styles.separator} />

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
                          placeholder="Model (e.g. Himalayan 450)"
                          onFocus={() => handleInputFocus(80)}
                        />
                        <Text style={styles.fieldLabel}>Model</Text>
                      </View>
                    </View>

                    <View style={styles.separator} />

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
                          onFocus={() => handleInputFocus(160)}
                        />
                        <Text style={styles.fieldLabel}>License Plate</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  disabled={isLoading}
                  onPress={handleDone}
                >
                  {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Done</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
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
    width: '100%',
  },
  subTitle: {
    color: '#aaa',
    fontSize: 16,
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
    marginBottom: 30,
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
    width: '100%',
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
    marginTop: 30, // Increased margin
    fontSize: 14,
  },
});
