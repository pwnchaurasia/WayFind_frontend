import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StatusBar, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  PixelRatio,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
import imagePath from '@/src/constants/imagePath'
import { theme } from '@/src/styles/theme';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import PhoneInput from "react-native-phone-number-input";
import { Link, router } from 'expo-router';
import * as Localization from 'expo-localization';
import LogoSection from '@/src/components/LogoSection';
import { useAnimatedStyle } from 'react-native-reanimated';
import { requestOTP } from '@/src/apis/authService';

const { width, height } = Dimensions.get('window');
const scale = PixelRatio.get();

const LoginPage = () => {
  const locales = Localization.getLocales()[0]['regionCode'];
  const [countryCode, setCountryCode] = useState('IN');
  const [valid, setValid] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const phoneInput = useRef(null);
  const scrollViewRef = useRef(null);

  // Validation function
  const validatePhoneNumber = () => {
    setValidationError('');
    
    if (!phoneValue || phoneValue.trim() === '') {
      setValidationError('Phone number is required');
      return false;
    }
    
    const checkValid = phoneInput.current?.isValidNumber(formattedValue);
    if (!checkValid) {
      setValidationError('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  // Handle OTP request
  const handleRequestOTP = async () => {
    if (!validatePhoneNumber()) {
      return;
    }

    setIsLoading(true);
    setValidationError('');

    try {
      const currentCountryCode = phoneInput.current?.getCountryCode();
      
      const payload = {
        phone_number: phoneValue,
        country_code: currentCountryCode || countryCode,
        formatted_phone: formattedValue
      };

      console.log('Requesting OTP with payload:', payload);
      
      const response = await requestOTP(payload);
      
      if (response) {
        console.log('OTP request successful:', response);
        // Navigate to verify OTP page
        router.push('/verify_otp');
      }
    } catch (error) {
      console.error('OTP request failed:', error);
      
      // Handle different error scenarios
      if (error?.message) {
        setValidationError(error.message);
      } else if (error?.error) {
        setValidationError(error.error);
      } else {
        setValidationError('Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update country code when phone input changes
  const handleCountryChange = (country) => {
    setCountryCode(country.cca2);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}> 
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background}/>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}
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
            <Image 
              source={imagePath.paper_plane} 
              style={styles.illustration}
              resizeMode='contain'
            />
            
            <Text style={styles.title}>Phone Number</Text>
            <Text style={styles.subtitle}>
              Please confirm your Country{'\n'}and your phone number.
            </Text>
            
            {/* Phone Input */}
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <PhoneInput
                  ref={phoneInput}
                  defaultValue={phoneValue}
                  defaultCode='IN'
                  layout="second"
                  onChangeText={(text) => {
                    setPhoneValue(text);
                    // Clear validation error when user starts typing
                    if (validationError) {
                      setValidationError('');
                    }
                  }}
                  onChangeFormattedText={(text) => {
                    setFormattedValue(text);
                  }}
                  onChangeCountry={handleCountryChange}
                  withDarkTheme
                  withShadow
                  containerStyle={[
                    styles.containerStyle,
                    validationError ? styles.containerStyleError : {}
                  ]}
                  textInputStyle={styles.textInputStyle}
                  codeTextStyle={styles.codeTextStyle}
                  textContainerStyle={[
                    styles.textContainerStyle,
                    validationError ? styles.textContainerStyleError : {}
                  ]}
                  placeholder="98 765 43221"
                  textInputProps={{
                    placeholderTextColor: theme.colors.placeholderText,
                    keyboardType: "phone-pad",
                    maxLength: 11,
                    cursorColor: theme.colors.textPrimary,
                    onFocus: () => {
                      // Scroll to a specific position to make input visible
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ 
                          y: 200, // Adjust this value to scroll more/less
                          animated: true 
                        });
                      }, 150);
                    },
                    onBlur: () => {
                      // Optional: scroll back up when input loses focus
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                      }, 100);
                    },
                  }}
                />
              </View>
              
              {/* Inline Validation Error */}
              {validationError ? (
                <Text style={styles.errorText}>{validationError}</Text>
              ) : null}
            </View>
          </View>
          
          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.otpButton, isLoading && styles.buttonDisabled]} 
              onPress={handleRequestOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#00C853" />
                  <Text style={[styles.buttonText, styles.loadingText]}>Sending OTP...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Request OTP</Text>
              )}
            </TouchableOpacity>
          </View>
          
        </ScrollView>
        
        {/* Footer - positioned at bottom */}
        <Text style={styles.footer}>Made with love in India by rjsnh1522</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default LoginPage

const styles = StyleSheet.create({
  // New styles for keyboard handling
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
    paddingBottom: height * 0.2, // More space for scrolling
  },
  
  countryCode:{
    width: '90%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  containerStyle:{
    width: '100%',
    backgroundColor: theme.colors.inputBoxBg,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors.input_text,
  },
  textInputStyle:{
    color: "#ffffff",
    fontSize: 16,
    width: '100%',
    backgroundColor: theme.colors.input_box,
    textAlign: 'left',
    height: '100%',
    padding: 0,
    marginTop: 0, 
    marginBottom: 0,  
    paddingTop: 0,    
    paddingBottom: 0, 
  },
  textContainerStyle:{
    backgroundColor: theme.colors.input_box,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    color: "ffffff"
  },
  codeTextStyle:{
    color: theme.colors.inputText,
    fontSize: 16,
    marginTop: 0, 
    marginBottom: 0,  
    paddingTop: 0,    
    paddingBottom: 0, 
    textAlignVertical: 'center'
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    backgroundColor: theme.colors.background
  },
  header: {
    width: '100%',
  },
  body: {
    flex: 2,
    backgroundColor: 'green',
    width: '100%',
  },
  footer: {
    flex: 1,
    backgroundColor: 'blue',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.05,
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: 27,
    height: 27,
    marginRight: 10,
  },
  appName: {
    fontSize: scale * 8,
    fontWeight: Poppins_600SemiBold,
    color: theme.colors.text,
  },
  contentContainer:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.05,
    paddingBottom: 30, // Extra space around input area
  },
  illustration: {
    width: width * 0.25,
    height: width * 0.25,
    marginBottom: height * 0.05,
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
  // Phone input container and validation styles
  phoneInputContainer: {
    width: '80%',
    alignItems: 'center',
  },
  containerStyleError: {
    borderWidth: 1,
    borderColor: theme.colors.errorBorderColor,
  },
  textContainerStyleError: {
    borderColor: theme.colors.errorBorderColor,
  },
  errorText: {
    color: theme.colors.errorTextColor,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  // Button styles
  buttonContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 15,
  },
  button: {
    width: '80%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00C853',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  otpButton: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  buttonDisabled: {
    opacity: 0.6,
    borderColor: '#666',
  },
  buttonText: {
    color: '#00C853',
    fontSize: 18,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
  },
  
  footer: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
})
