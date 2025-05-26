import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { theme } from '@/src/styles/theme';
import { Feather } from '@expo/vector-icons';
import imagePath from '@/src/constants/imagePath';
import LogoSection from '@/src/components/LogoSection';
import {Link} from 'expo-router';



const { width, height } = Dimensions.get('window');

const UpdateProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameCount, setNameCount] = useState(0);

  const handleSubmit = async () => {
    console.log("Name:", name);
    console.log("Email:", email);

    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay
    console.log("Success! Navigating now...");
    router.push("/(group)"); // 👈 navigate to groups page

  }



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
      
        {/* Logo Section */}
        <LogoSection />
        
        {/* Middle Content */}
        <View style={styles.contentContainer}>
          <Image 
            source={imagePath.avatar_pixel} 
            style={styles.illustration}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>Profile Look</Text>
          <Text style={styles.subtitle}>
            You can change profile Avatar,{'\n'}Set some bio and choose a username
          </Text>
          
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>M</Text>
            </View>
            <TouchableOpacity style={styles.editIcon}>
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
                  onChangeText={setName}
                  placeholderTextColor="#666"
                  placeholder="You'r Good Name"
                  maxLength={20}
                  onChange={(event) => {
                    setNameCount(event.nativeEvent.text.length); }}
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
          </View>
        </View>
        
        {/* Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Done</Text>
            {/* <Link href="(group)" style={styles.buttonText}>Done</Link> */}
          </TouchableOpacity>
        </View>
        
      </KeyboardAvoidingView>
      {/* Footer */}
        <Text style={styles.footer}>Made in India by rjsnh1522</Text>
    </SafeAreaView>
  );
}

export default UpdateProfile;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: width * 0.05,
    backgroundColor: theme.colors.input_box,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    height: '100%',
    // alignItems: 'center',
    // flexDirection: 'row',
    // justifyContent: 'center',
    // alignItems: 'center',
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
    marginBottom: 10,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: height * 0.05,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: '#7B68EE', // Purple color for avatar
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: height * 0.05,
    // flex: 1,
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