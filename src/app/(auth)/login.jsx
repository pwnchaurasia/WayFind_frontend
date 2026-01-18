import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
import imagePath from '@/src/constants/imagePath'
import { theme } from '@/src/styles/theme';
import { router, useLocalSearchParams } from 'expo-router';
import LogoSection from '@/src/components/LogoSection';
import { requestOTP } from '@/src/apis/authService';

const { width, height } = Dimensions.get('window');

const LoginPage = () => {
  const { returnTo } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [validationError, setValidationError] = useState('');

  const validatePhoneNumber = () => {
    setValidationError('');

    // Remove any spaces or special characters
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');

    if (!cleanNumber) {
      setValidationError('Please enter your phone number');
      return false;
    }

    if (cleanNumber.length < 10) {
      setValidationError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handlePhoneLogin = async () => {
    if (!validatePhoneNumber()) {
      return;
    }

    setIsLoading(true);
    setValidationError('');

    try {
      const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
      const formattedPhone = `${countryCode}${cleanNumber}`;

      const payload = {
        phone_number: cleanNumber,
        country_code: countryCode,
        formatted_phone: formattedPhone
      };

      console.log("Requesting OTP for:", payload);
      const response = await requestOTP(payload);
      console.log("OTP Request Response:", response?.data);

      if (response && (response.status === 200 || response.status === 201)) {
        // Navigate to OTP verification screen
        router.push({
          pathname: '/(auth)/verify_otp',
          params: {
            phone_number: cleanNumber,
            country_code: countryCode,
            formatted_phone: formattedPhone,
            returnTo
          }
        });
      } else {
        setValidationError('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP request failed:', error);
      if (error?.message) {
        setValidationError(error.message);
      } else {
        setValidationError('Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      "Google Sign-In",
      "Google Sign-In requires a development build. Currently using Phone Login.\n\nTo enable Google Sign-In, run:\nnpx expo run:android\nor\nnpx expo run:ios"
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <LogoSection />

            <View style={styles.illustrationContainer}>
              <Image
                source={imagePath.paper_plane}
                style={styles.illustration}
                resizeMode='contain'
              />
            </View>

            <View style={styles.textSection}>
              <Text style={styles.title}>Welcome to Squadra</Text>
              <Text style={styles.subtitle}>
                Join the community of riders. Plan, ride, and explore together.
              </Text>
            </View>

            <View style={styles.authSection}>
              {/* Phone Number Input */}
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                </View>
                <TextInput
                  style={[
                    styles.phoneInput,
                    validationError ? styles.inputError : {}
                  ]}
                  placeholder="Enter phone number"
                  placeholderTextColor="#666"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (validationError) setValidationError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={!isLoading}
                />
              </View>

              {/* Validation Error */}
              {validationError ? (
                <Text style={styles.errorText}>{validationError}</Text>
              ) : null}

              {/* Phone Login Button */}
              <TouchableOpacity
                style={[styles.phoneButton, isLoading && styles.buttonDisabled]}
                onPress={handlePhoneLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.phoneButtonText}>Continue with Phone</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              {/* Google Button (Disabled in Expo Go) */}
              <TouchableOpacity
                style={[styles.googleButton, styles.googleButtonDisabled]}
                onPress={handleGoogleLogin}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
                <Text style={styles.devBuildText}>(Dev Build)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Text style={styles.footer}>By continuing, you agree to our Terms & Privacy Policy.</Text>
    </SafeAreaView>
  )
}

export default LoginPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    paddingBottom: 20
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  illustrationContainer: {
    marginTop: height * 0.03,
    marginBottom: height * 0.02,
  },
  illustration: {
    width: width * 0.35,
    height: width * 0.35,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20
  },
  authSection: {
    width: '100%',
    gap: 12
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBoxBg || '#2A2A2A',
    borderRadius: 30,
    overflow: 'hidden',
  },
  countryCodeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#444',
  },
  countryCodeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: 'white',
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.colors.errorBorderColor || '#ff4444',
  },
  errorText: {
    color: theme.colors.errorTextColor || '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  phoneButton: {
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: theme.colors.buttonBackgroundGreen || '#00C853',
    alignItems: 'center'
  },
  phoneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333'
  },
  orText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 12
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    gap: 12
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleIcon: {
    width: 24,
    height: 24
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black'
  },
  devBuildText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 30
  }
})
