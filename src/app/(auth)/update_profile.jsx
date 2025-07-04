import React, { useState, useRef } from 'react';
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
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/styles/theme';
import { Feather } from '@expo/vector-icons';
import imagePath from '@/src/constants/imagePath';
import LogoSection from '@/src/components/LogoSection';
import { Link, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

const UpdateProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameCount, setNameCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const scrollViewRef = useRef(null);

  const handleSubmit = async () => {
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Profile Image:", profileImage);

    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay
    console.log("Success! Navigating now...");
    router.push("/(group)"); // 👈 navigate to groups page
  }

  const handleTextChange = (newText) => {
    const validText = newText.replace(/[^a-zA-Z\s]/g, '');
    setName(validText);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // Handle input focus - scroll to make visible
  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ 
        y: 150, // Reduced scroll distance
        animated: true 
      });
    }, 100);
  };

  // Handle input blur - scroll back
  const handleInputBlur = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          style={styles.scrollView}
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
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
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
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                  <Text style={styles.fieldLabel}>Email</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <Text style={styles.footer}>Made in India by rjsnh1522</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default UpdateProfile;

const styles = StyleSheet.create({
  // Keyboard handling styles
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    minHeight: height, // Ensure minimum height
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
    marginTop: height * 0.03, // Reduced margin
    paddingBottom: height * 0.05, // Add padding to prevent cutting
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
    marginTop: 'auto', // Push button to bottom
    marginBottom: height * 0.02,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
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
});