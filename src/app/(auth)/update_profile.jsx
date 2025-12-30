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
  Keyboard,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/styles/theme';
import { Feather } from '@expo/vector-icons';
import imagePath from '@/src/constants/imagePath';
import LogoSection from '@/src/components/LogoSection';
import { Link, router } from 'expo-router';
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

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);

  console.log("user here test test test", user)

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
      console.error("Profile/Vehicle update failed:", error);
      Alert.alert('Error', 'Failed to complete profile setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleTextChange = (newText) => {
    const validText = newText.replace(/[^a-zA-Z\s]/g, '');
    setName(validText);
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      const keyboardHeight = event.endCoordinates.height;
      setKeyboardHeight(keyboardHeight);

      Animated.timing(animatedValue, {
        toValue: -keyboardHeight * 0.3, // Move up by 30% of keyboard height
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);

      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
        mediaTypes: ImagePicker.MediaType,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY: animatedValue }]
          }
        ]}
      >
        {/* Logo Section */}
        <LogoSection />

        {/* Middle Content */}
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
                <Feather name="more-horizontal" size={24} color="#00C853" />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={handleTextChange}
                  placeholderTextColor="#666"
                  placeholder="You'r Good Name"
                  maxLength={20}
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
                />
                <Text style={styles.fieldLabel}>Email</Text>
              </View>
            </View>

            <View style={styles.separator} />

            {/* Vehicle Section Header */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }}
              onPress={() => setHasVehicle(!hasVehicle)}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#00C853',
                justifyContent: 'center', alignItems: 'center', marginRight: 10,
                backgroundColor: hasVehicle ? '#00C853' : 'transparent'
              }}>
                {hasVehicle && <Feather name="check" size={14} color="white" />}
              </View>
              <Text style={{ color: 'white', fontSize: 16 }}>I have a motorcycle</Text>
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
            style={[styles.button, styles.otpButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={handleSubmit}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Made with love in India by rjsnh1522</Text>
      </Animated.View>
    </SafeAreaView >
  );
}

export default UpdateProfile;

const styles = StyleSheet.create({
  // Animated container for smooth keyboard handling
  animatedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: width * 0.05,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: height * 0.02,
    width: '100%',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: 'contain',
  },
  appName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.03,
    paddingHorizontal: width * 0.05,
  },
  illustration: {
    width: width * 0.25,
    height: width * 0.25,
    marginBottom: height * 0.03,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '600',
    marginBottom: height * 0.03, // Reduced margin
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: height * 0.04, // Reduced margin
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7B68EE', // Purple color for avatar
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure image fits within circle
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: 'white',
    fontSize: 56,
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
    borderColor: '#121212',
  },
  fieldsContainer: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    marginBottom: height * 0.03,
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
  buttonContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: width * 0.05,
  },
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00C853',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: '#00C853',
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  otpButton: {
    backgroundColor: theme.colors.buttonBackgroundGreen,
  },
});
