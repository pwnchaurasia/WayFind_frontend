import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StatusBar, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TextInput,
  Keyboard,
  Animated,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/src/styles/theme';
import LogoSection from '@/src/components/LogoSection';
import imagePath from '../../constants/imagePath';
import { router, useLocalSearchParams } from 'expo-router';
import { verifyOTP } from '@/src/apis/authService';
import { setToken } from '@/src/utils/token';

const { width, height } = Dimensions.get('window');

const VerifyOtp = () => {
  const params = useLocalSearchParams();
  const [timer, setTimer] = useState(60); // 60 in seconds
  const [code, setCode] = useState(['', '', '', '', '', '']); // Changed to empty initial state
  const inputRefs = useRef([]);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Setup timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      const keyboardHeight = event.endCoordinates.height;
      
      Animated.timing(animatedValue, {
        toValue: -keyboardHeight * 0.2, // Move up by 20% of keyboard height
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
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

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validation function
  const validateOTP = () => {
    setValidationError('');
    
    const otpCode = code.join('');
    if (!otpCode || otpCode.length !== 6) {
      setValidationError('Please enter the complete 6-digit OTP code');
      return false;
    }
    
    return true;
  };

  const handleverifyOTP = async () => {
    if (!validateOTP()) {
      return;
    }

    setIsLoading(true);
    setValidationError('');

    try {
      const otpCode = code.join('');
      
      const payload = {
        phone_number: params.phone_number,
        country_code: params.country_code,
        formatted_phone: params.formatted_phone,
        otp: otpCode
      };
      const response = await verifyOTP(payload);
      console.log("Response from verifyOTP:", response.data, response.status);
      if (response && (response.status === 201)) {
        if (response.data) {
          setToken({
            access_token: response.data.access_token, 
            refresh_token: response.data.refresh_token
          });
          if(response.data.is_profile_complete === false){
            router.push('/update_profile');
          }
          else {
            router.push('/(main)/(tabs)');
          }
        }else{
          console.log('no data found in response')
        }
      }else{
        console.log('I am here')
      }

    } catch (error) {
      console.error('OTP verification failed:', error);
      // Handle different error scenarios
      if (error?.message) {
        setValidationError(error.message);
      } else if (error?.error) {
        setValidationError(error.error);
      } else {
        setValidationError('Invalid OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle code input
  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    
    // Handle single digit input
    if (text.length <= 1) {
      newCode[index] = text;
      setCode(newCode);
      
      // Clear validation error when user starts typing
      if (validationError) {
        setValidationError('');
      }
      
      // Auto-focus next input if text is entered and not the last input
      if (text && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle backspace - move to previous input
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
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
            <Image 
              source={imagePath.mailbox} 
              style={styles.illustration}
              resizeMode="contain"
            />
            
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              Please Enter Code that we Send you{'\n'}to your Phone.
            </Text>
            
            {/* Code Input */}
            <View style={styles.codeInputContainer}>
              <View style={styles.codeContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.codeInput, 
                      code[index] ? styles.filledInput : {},
                      validationError ? styles.errorInput : {},
                    ]}
                    value={code[index]}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectionColor="#00C853"
                  />
                ))}
              </View>
              
              {/* Validation Error */}
              {validationError ? (
                <Text style={styles.errorText}>{validationError}</Text>
              ) : null}
            </View>
            
            {/* Resend Timer */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Resend in <Text style={styles.timerText}>{formatTime(timer)}</Text>
              </Text>
            </View>

          </View>
          
          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
            style={[styles.button, styles.otpButton, isLoading && styles.buttonDisabled]}
            onPress={handleverifyOTP}
            disabled={isLoading}
            >
              {/* <Link href="/update_profile" style={styles.buttonText}> Verify Code</Link> */}

            {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#00C853" />
                  <Text style={[styles.buttonText, styles.loadingText]}>Verifying OTP...</Text>
                </View>
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}

            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <Text style={styles.footer}>Made with love in India by rjsnh1522</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

export default VerifyOtp

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
    marginTop: height * 0.05, // Add space between logo and content
  },
  illustration: {
    width: width * 0.3,
    height: width * 0.3,
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
  codeInputContainer: {
    width: '80%',
    alignItems: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  codeInput: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.inputBoxBg,
    borderRadius: 5,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    textAlignVertical: 'center', // This centers text vertically on Android
    fontWeight: 'bold',
    lineHeight: 20, // This helps center text vertically on iOS (matches height)
  },
  filledInput: {
    borderWidth: 1,
    borderColor: '#00C853',
  },
  errorInput: {
    borderWidth: 1,
    borderColor: theme.colors.errorBorderColor,
  },
  activeInput: {
    borderWidth: 1,
    borderColor: '#00C853',
  },
  errorText: {
    color: theme.colors.errorTextColor,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  resendContainer: {
    marginTop: height * 0.04,
  },
  resendText: {
    color: 'white',
    fontSize: 16,
  },
  timerText: {
    textDecorationLine: 'underline',
  },
  callOption: {
    marginTop: height * 0.02,
  },
  callOptionText: {
    color: '#00C853',
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
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
  buttonDisabled: {
    opacity: 0.6,
    borderColor: '#666',
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
  otpButton: {
    backgroundColor: theme.colors.buttonBackgroundGreen,
  },
});
